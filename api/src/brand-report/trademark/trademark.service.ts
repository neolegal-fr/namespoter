import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../common/logging/app-logger.service';
import type { TrademarkHit, TrademarkMatch, TrademarkResult } from '../dto/brand-report.types';

const BASE = 'https://api-gateway.inpi.fr';
const AUTH_URL = `${BASE}/services/uaa/api/authenticate`;
const LOGIN_URL = `${BASE}/auth/login`;
const SEARCH_URL = `${BASE}/services/apidiffusion/api/marques/search`;
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Chaque notice consomme une unité de quota, exactement comme une recherche.
 *
 * Mesuré le 20/08/2026 sur le compte de production, en lisant les en-têtes que
 * la passerelle renvoie : `x-rate-limit-remaining` (100 unités) et
 * `x-size-limit-remaining` (~50 Mo). Une recherche fait −1, une notice fait −1
 * aussi — ce n'est donc pas « la recherche coûte, l'enrichissement est gratuit ».
 *
 * Conséquence directe sur le plafond : un rapport coûte jusqu'à
 * 1 + MAX_NOTICE_FETCHES unités, soit 6 — donc **au plus ~16 rapports par
 * période**, tous comptes confondus, puisqu'il n'y a qu'un compte INPI.
 *
 * La DURÉE de la période n'est écrite nulle part : ni dans les en-têtes (aucun
 * `x-rate-limit-reset` ni `Retry-After`), ni dans l'OpenAPI de la passerelle,
 * ni dans la documentation publique de l'INPI. Constaté seulement qu'elle
 * dépasse la dizaine de minutes : trois appels espacés de sept minutes se sont
 * cumulés sans réinitialisation.
 */
const MAX_NOTICE_FETCHES = 5;

/** ukey préfixe → code de collection lisible. */
const COLLECTION_CODE: Record<string, TrademarkHit['collection']> = {
  FMARK: 'FR',
  CTMARK: 'EU',
  TMINT: 'WO',
};

/**
 * Pré-vérification marque via l'API INPI diffusion (couvre FR+EU+WO en une
 * requête — recette du spike US-050).
 *
 * Points clés découverts au spike :
 * - le champ cherchable est **`Mark_Exp`** (l'exemple `[Mark=…]` de la spec
 *   provoque une 500 Solr côté INPI) ;
 * - les collections en entrée sont les codes courts **`FR`/`EU`/`WO`** ;
 * - la gateway (JHipster) fait tourner le **jeton XSRF à chaque requête** : il
 *   faut relire le cookie et le renvoyer en `X-XSRF-TOKEN` à chaque appel.
 *
 * Signal indicatif — jamais une recherche d'antériorité légale. En l'absence
 * d'identifiants ou en cas d'erreur, repli propre : `unknown` + lien profond.
 */
@Injectable()
export class TrademarkService {
  private readonly logger = new Logger(TrademarkService.name);
  private readonly username?: string;
  private readonly password?: string;

  constructor(config: ConfigService, private readonly events: AppLoggerService) {
    this.username = config.get<string>('INPI_USERNAME');
    this.password = config.get<string>('INPI_PASSWORD');
  }

  async check(name: string): Promise<TrademarkResult> {
    const deepLink = this.deepLink(name);
    if (!this.username || !this.password) {
      // Journalisé, et pas seulement retourné : sans identifiants, TOUS les
      // rapports sortent « non vérifiable » sur le volet marque — pour 50
      // crédits. Une panne de configuration en production doit apparaître dans
      // `python3 - errors`, pas seulement dans un rapport que personne ne relit.
      this.events.warn('INPI_USERNAME/INPI_PASSWORD absents : volet marque non vérifiable', 'trademark_check_unconfigured');
      this.events.event('trademark_check_unconfigured');
      return { office: 'INPI', match: 'unknown', hits: [], deepLink, note: 'Vérification INPI non configurée.' };
    }
    try {
      const cookies = await this.authenticate();
      const data = await this.search(name, cookies);
      const hits = this.parseHits(data);
      await this.enrichClasses(name, hits, cookies);
      return { office: 'INPI', match: this.classify(name, hits), hits, deepLink };
    } catch (err) {
      this.events.event('trademark_check_failed', { reason: err instanceof Error ? err.name : 'unknown' });
      return { office: 'INPI', match: 'unknown', hits: [], deepLink, note: 'Vérification INPI temporairement indisponible.' };
    }
  }

  /** Recherche officielle INPI pré-remplie (repli et CTA « démarche officielle »). */
  deepLink(name: string): string {
    return `https://data.inpi.fr/search?q=${encodeURIComponent(name)}&type=brands`;
  }

  // --- INPI gateway (auth XSRF double-submit + session par cookies) ----------

  /** Authentifie et renvoie le magasin de cookies (XSRF-TOKEN, access_token…). */
  private async authenticate(): Promise<CookieJar> {
    const jar = new CookieJar();

    const auth = await this.fetch(AUTH_URL, { method: 'GET' }, jar);
    auth.body?.cancel?.();
    if (!jar.get('XSRF-TOKEN')) throw new Error('XSRF-TOKEN absent');

    const login = await this.fetch(
      LOGIN_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
        body: JSON.stringify({ username: this.username, password: this.password, rememberMe: true }),
      },
      jar,
    );
    login.body?.cancel?.();
    if (login.status !== 200) throw new Error(`login HTTP ${login.status}`);
    if (!jar.get('access_token')) throw new Error('access_token absent');
    return jar;
  }

  private async search(name: string, jar: CookieJar): Promise<unknown> {
    const body = JSON.stringify({
      query: `[Mark_Exp=${this.sanitize(name)}]`,
      collections: ['FR', 'EU', 'WO'],
      size: 20,
      position: 0,
      fields: ['ApplicationNumber', 'Mark', 'MarkCurrentStatusCode', 'ukey'],
    });
    const res = await this.fetch(
      SEARCH_URL,
      { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body },
      jar,
    );
    if (res.status !== 200) {
      res.body?.cancel?.();
      throw new Error(`search HTTP ${res.status}`);
    }
    return res.json();
  }

  /** Fetch borné qui envoie les cookies du jar + le X-XSRF-TOKEN courant, et absorbe les Set-Cookie. */
  private async fetch(url: string, init: RequestInit, jar: CookieJar): Promise<Response> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);
    try {
      const headers = new Headers(init.headers);
      const cookieHeader = jar.header();
      if (cookieHeader) headers.set('Cookie', cookieHeader);
      const xsrf = jar.get('XSRF-TOKEN');
      if (xsrf) headers.set('X-XSRF-TOKEN', xsrf);

      const res = await fetch(url, { ...init, headers, redirect: 'manual', signal: abort.signal });
      jar.absorb(res.headers.getSetCookie?.() ?? []);
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Enrichissement des classes de Nice (via la notice ST66) ---------------

  /**
   * Complète `classes` pour les dépôts les plus pertinents : d'abord les
   * correspondances exactes du nom, puis les autres, dans la limite de
   * MAX_NOTICE_FETCHES pour ménager le quota INPI. Best-effort : une notice en
   * échec laisse simplement `classes: []`.
   */
  private async enrichClasses(name: string, hits: TrademarkHit[], jar: CookieJar): Promise<void> {
    const norm = (s: string) => s.trim().toLowerCase();
    const targets = [...hits]
      .filter((h) => h.noticeUrl)
      .sort((a, b) => Number(norm(b.name) === norm(name)) - Number(norm(a.name) === norm(name)))
      .slice(0, MAX_NOTICE_FETCHES);

    await Promise.all(
      targets.map(async (hit) => {
        try {
          hit.classes = await this.fetchClasses(hit.noticeUrl!, jar);
        } catch {
          // Best-effort : on garde classes: [].
        }
      }),
    );
  }

  private async fetchClasses(noticeUrl: string, jar: CookieJar): Promise<number[]> {
    const res = await this.fetch(noticeUrl, { method: 'GET', headers: { Accept: 'application/xml' } }, jar);
    if (res.status !== 200) {
      res.body?.cancel?.();
      return [];
    }
    return this.extractNiceClasses(await res.text());
  }

  /** Classes de Nice depuis la notice ST66 : <ClassNumber>NN</ClassNumber>, dédupliquées et triées. */
  private extractNiceClasses(xml: string): number[] {
    const set = new Set<number>();
    for (const m of xml.matchAll(/<ClassNumber>\s*(\d{1,2})\s*<\/ClassNumber>/g)) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 45) set.add(n); // classification de Nice : classes 1 à 45
    }
    return [...set].sort((a, b) => a - b);
  }

  // --- Parsing ---------------------------------------------------------------

  private parseHits(data: unknown): TrademarkHit[] {
    const results = (data as { results?: unknown[] })?.results ?? [];
    return results.map((r) => {
      const row = r as { fields?: FieldEntry[]; xml?: { href?: string } };
      const fields = this.fieldMap(row.fields ?? []);
      const ukey = fields['ukey'] ?? '';
      return {
        name: fields['Mark'] ?? '',
        classes: [],
        status: fields['MarkCurrentStatusCode'],
        collection: COLLECTION_CODE[ukey.split('|')[0]] ?? undefined,
        applicationNumber: fields['ApplicationNumber'],
        noticeUrl: row.xml?.href,
      };
    });
  }

  private fieldMap(fields: FieldEntry[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const f of fields) if (f?.name) map[f.name] = this.decode(String(f.value ?? ''));
    return map;
  }

  /** Les valeurs INPI arrivent HTML-échappées (ex. « l&apos;objet »). */
  private decode(s: string): string {
    return s
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  /** `exact` si une marque porte exactement ce nom, `similar` si d'autres correspondances, sinon `none`. */
  private classify(name: string, hits: TrademarkHit[]): TrademarkMatch {
    if (!hits.length) return 'none';
    const norm = (s: string) => s.trim().toLowerCase();
    return hits.some((h) => norm(h.name) === norm(name)) ? 'exact' : 'similar';
  }

  /** Le nom entre dans un DSL entre crochets : retirer ce qui casserait la syntaxe. */
  private sanitize(name: string): string {
    return name.replace(/[[\]=]/g, ' ').trim();
  }
}

interface FieldEntry {
  name: string;
  value: unknown;
}

/** Magasin de cookies minimal : conserve la dernière valeur par nom (XSRF tourne à chaque réponse). */
class CookieJar {
  private readonly store = new Map<string, string>();

  absorb(setCookies: string[]): void {
    for (const sc of setCookies) {
      const pair = sc.split(';', 1)[0];
      const eq = pair.indexOf('=');
      if (eq <= 0) continue;
      this.store.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  get(name: string): string | undefined {
    return this.store.get(name);
  }

  header(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}
