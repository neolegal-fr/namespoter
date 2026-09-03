import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../common/logging/app-logger.service';
import type { TrademarkHit, TrademarkMatch, TrademarkProximity, TrademarkResult } from '../dto/brand-report.types';
import { NameVariantsService, squash } from './name-variants.service';

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
 * MAX_UNITS_PER_REPORT unités — une recherche par orthographe cherchée, plus
 * une notice par dépôt retenu — donc **au plus ~12 rapports par période**,
 * tous comptes confondus, puisqu'il n'y a qu'un compte INPI.
 *
 * La DURÉE de la période n'est écrite nulle part : ni dans les en-têtes (aucun
 * `x-rate-limit-reset` ni `Retry-After`), ni dans l'OpenAPI de la passerelle,
 * ni dans la documentation publique de l'INPI. Constaté seulement qu'elle
 * dépasse la dizaine de minutes : trois appels espacés de sept minutes se sont
 * cumulés sans réinitialisation.
 */
const MAX_NOTICE_FETCHES = 5;

/**
 * Orthographes supplémentaires cherchées, au-delà du nom lui-même.
 *
 * Chacune est une requête, donc une unité de quota sur un compte partagé par
 * tout le produit. Deux suffisent : au-delà, on paie pour des découpages de
 * moins en moins plausibles. Voir `NameVariantsService`.
 */
const MAX_VARIANT_SEARCHES = 2;

/** Plafond de consommation d'un rapport : les recherches, plus les notices. */
const MAX_UNITS_PER_REPORT = 1 + MAX_VARIANT_SEARCHES + MAX_NOTICE_FETCHES;

/**
 * Seuil d'alerte sur le quota restant : moins de deux rapports possibles.
 *
 * Le manque de quota ne casse rien de visible — il fait retomber le volet
 * marque sur « non vérifiable », dans un rapport facturé 50 crédits. C'est
 * exactement le genre de panne qu'il faut voir venir.
 */
const QUOTA_WARN_BELOW = 2 * MAX_UNITS_PER_REPORT;

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
 * - le champ cherchable est **`Mark_Exp`**. La note du spike disait que
 *   l'exemple `[Mark=…]` de la spec provoquait une 500 Solr : c'était
 *   passager. Réessayé le 03/09/2026, `[Mark=qonto]` et `[Mark_Exp=qonto]`
 *   renvoient les mêmes 9 dépôts. On garde `Mark_Exp`, mais le choix ne tient
 *   plus à une panne de l'autre ;
 * - la valeur doit être **entre guillemets** (voir `buildQuery`) — sans quoi
 *   un nom en plusieurs mots devient un OU entre ses mots ;
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

  constructor(
    config: ConfigService,
    private readonly events: AppLoggerService,
    private readonly nameVariants: NameVariantsService,
  ) {
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
    // Un nom qui ne survit pas à l'assainissement (que des crochets, que des
    // guillemets) donnerait `[Mark_Exp=""]` — une requête vide, dont la réponse
    // ne veut rien dire. Mieux vaut ne pas la poser que d'en tirer un « aucun
    // dépôt identique » sur du néant.
    if (!this.sanitize(name)) {
      return { office: 'INPI', match: 'unknown', hits: [], deepLink, note: 'Nom inexploitable pour la recherche INPI.' };
    }
    try {
      const cookies = await this.authenticate();
      const hits = await this.searchAllSpellings(name, cookies);
      await this.enrichClasses(name, hits, cookies);
      return { office: 'INPI', match: this.classify(name, hits), hits, deepLink };
    } catch (err) {
      this.events.event('trademark_check_failed', { reason: err instanceof Error ? err.name : 'unknown' });
      return { office: 'INPI', match: 'unknown', hits: [], deepLink, note: 'Vérification INPI temporairement indisponible.' };
    }
  }

  /**
   * Cherche le nom, puis ses autres orthographes, et fusionne.
   *
   * Une requête par orthographe : la passerelle ne sait pas les regrouper (cf.
   * `buildQuery`). L'ordre compte — le nom d'abord, les variantes ensuite —
   * parce que la déduplication garde la première occurrence, et que les
   * classes de Nice se lisent en priorité sur les dépôts les plus proches.
   *
   * Une variante qui échoue ne fait pas échouer la vérification : on garde ce
   * qu'on a. L'inverse transformerait une recherche élargie, donc un progrès,
   * en nouvelle cause de panne.
   */
  private async searchAllSpellings(name: string, jar: CookieJar): Promise<TrademarkHit[]> {
    const spellings = [name, ...(await this.variantsOf(name))];
    const byId = new Map<string, TrademarkHit>();

    for (const [index, spelling] of spellings.entries()) {
      try {
        for (const hit of this.parseHits(await this.search(spelling, jar))) {
          const id = hit.applicationNumber || `${hit.collection ?? ''}|${hit.name}`;
          if (!byId.has(id)) byId.set(id, { ...hit, proximity: this.proximity(name, hit.name) });
        }
      } catch (err) {
        if (index === 0) throw err; // le nom lui-même : c'est une vraie panne
        this.events.event('trademark_variant_search_failed', { reason: err instanceof Error ? err.name : 'unknown' });
      }
    }
    return [...byId.values()];
  }

  /** Les autres orthographes à interroger, bornées par le quota. Best-effort. */
  private async variantsOf(name: string): Promise<string[]> {
    try {
      const variants = (await this.nameVariants.variants(name)).slice(0, MAX_VARIANT_SEARCHES);
      if (variants.length) this.events.event('trademark_variants_searched', { count: variants.length });
      return variants;
    } catch {
      return [];
    }
  }

  /**
   * À quelle distance du nom cherché se trouve ce dépôt.
   *
   * `normalized` n'est pas un demi-`exact` de complaisance : « Neo Legal »
   * face à « neolegal », c'est le même nom à un espace près, et l'INPI le
   * traiterait comme tel. C'est précisément le cas que la recherche par jetons
   * laissait passer.
   */
  private proximity(name: string, hitName: string): TrademarkProximity {
    if (hitName.trim().toLowerCase() === name.trim().toLowerCase()) return 'exact';
    if (squash(hitName) === squash(name) && squash(name) !== '') return 'normalized';
    return 'other';
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

  /**
   * Requête de recherche : le nom entre GUILLEMETS, donc cherché comme une
   * phrase et non comme un sac de mots.
   *
   * Sans eux, `Mark_Exp` découpe sur les espaces et fait un OU entre les
   * termes. Mesuré le 03/09/2026 sur la passerelle de production :
   *
   *   [Mark_Exp=neo legal]   → 3818 résultats, et la marque réellement
   *                            homonyme ABSENTE de la page renvoyée (le tri
   *                            se fait par date de dépôt, pas par pertinence) ;
   *   [Mark_Exp="neo legal"] → 1 résultat, le bon.
   *
   * Le volet marque annonçait donc « marques proches existantes » sur un tas
   * de dépôts sans aucun rapport — SAHIRA NEO, bauer.legal, LQ Legal
   * Quotient — pour tout nom en plusieurs mots, tout en passant à côté du
   * seul qui comptait. Un point, un tiret ou une apostrophe suffisaient :
   * `neolegal.fr` ramenait 9455 résultats.
   *
   * Une phrase par requête, et une seule : la passerelle ne connaît pas
   * l'opérateur booléen. `OR` y est traité comme un mot ordinaire — il ramène
   * « CARTE D'OR ». Grouper deux orthographes dans une même requête est donc
   * impossible ; il faudrait deux appels, donc deux unités de quota.
   */
  private buildQuery(name: string): string {
    return `[Mark_Exp="${this.sanitize(name)}"]`;
  }

  private async search(name: string, jar: CookieJar): Promise<unknown> {
    const body = JSON.stringify({
      query: this.buildQuery(name),
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
      this.trackQuota(url, res);
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Journalise le quota restant, à chaque appel qui l'expose.
   *
   * La passerelle renvoie `x-rate-limit-remaining` (sur 100) et
   * `x-size-limit-remaining` (~50 Mo) sur les appels de diffusion — recherche
   * et notice, pas sur l'authentification. Aucun en-tête ne dit quand le
   * compteur repart : la seule façon de connaître la période est de suivre sa
   * valeur dans le temps, d'où cette trace à chaque appel.
   *
   * Ce n'est pas du « au cas où » : le compteur est partagé par tout le
   * produit (un seul compte INPI) et un rapport en consomme jusqu'à six.
   *
   * Best-effort, comme toute écriture de journal : une trace ne doit jamais
   * faire échouer la requête qu'elle observe.
   */
  private trackQuota(url: string, res: Response): void {
    try {
      // `Number(null)` vaut 0, pas NaN : sans ce test d'absence, un appel SANS
      // quota (authentification, login) serait journalisé comme « 0 restant »,
      // c'est-à-dire comme une panne.
      const remaining = num(res.headers.get('x-rate-limit-remaining'));
      if (remaining === null) return;
      const bytes = num(res.headers.get('x-size-limit-remaining'));
      this.events.event('trademark_quota_observed', {
        endpoint: url.includes('/search') ? 'search' : 'notice',
        remaining,
        ...(bytes === null ? {} : { bytesRemaining: bytes }),
      });
      if (remaining < QUOTA_WARN_BELOW) {
        this.events.warn(
          `Quota INPI presque épuisé : ${remaining} appels restants (un rapport en consomme jusqu'à ${1 + MAX_NOTICE_FETCHES})`,
          'trademark_quota_low',
        );
      }
    } catch {
      // Une trace ne casse pas une requête.
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
    // La classe de Nice est ce qui décide du risque réel : on la lit d'abord
    // sur les dépôts qui portent le même nom, quitte à laisser sans classe les
    // voisins lointains que le quota ne permet pas d'aller chercher.
    const rank = (h: TrademarkHit) => {
      const p = h.proximity ?? this.proximity(name, h.name);
      return p === 'exact' ? 0 : p === 'normalized' ? 1 : 2;
    };
    const targets = [...hits]
      .filter((h) => h.noticeUrl)
      .sort((a, b) => rank(a) - rank(b))
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

  /**
   * `exact` si un dépôt porte le même nom — au caractère près OU aux seuls
   * séparateurs et accents près. `similar` si la recherche a remonté autre
   * chose, `none` si elle n'a rien remonté.
   *
   * Faire tomber « Neo Legal » face à « neolegal » dans `similar` reviendrait
   * à peindre en orange ce qui mérite du rouge : pour l'INPI, l'espace ne
   * distingue pas deux marques.
   */
  private classify(name: string, hits: TrademarkHit[]): TrademarkMatch {
    if (!hits.length) return 'none';
    return hits.some((h) => this.proximity(name, h.name) !== 'other') ? 'exact' : 'similar';
  }

  /**
   * Le nom entre dans un DSL entre crochets ET, désormais, entre guillemets :
   * retirer ce qui casserait l'une ou l'autre syntaxe.
   *
   * Le guillemet compte autant que les crochets. Laissé passer, il refermerait
   * la phrase au milieu du nom et rendrait le OU entre les mots restants —
   * c'est-à-dire exactement le défaut que les guillemets corrigent.
   *
   * Les espaces sont normalisés : une phrase à double espace ne correspond à
   * rien dans l'index.
   */
  private sanitize(name: string): string {
    return name.replace(/["\\[\]=]/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/** En-tête numérique, ou `null` s'il est absent ou illisible. */
function num(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
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
