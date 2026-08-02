import { Injectable, Logger } from '@nestjs/common';

/** Annuaire officiel : chaque TLD y déclare son serveur RDAP. */
const BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';
/** L'annuaire bouge de quelques entrées par mois : un rafraîchissement par jour suffit. */
const BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1000;
/** Délai avant de retenter l'annuaire après un échec. */
const BOOTSTRAP_RETRY_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Interrogation RDAP, successeur officiel du WHOIS voulu par l'ICANN.
 *
 * Pourquoi le préférer au port 43 : la réponse est un code HTTP, pas du texte
 * libre à deviner registre par registre — **404 = libre, 200 = pris**. Là où
 * WHOIS impose une liste de motifs par TLD, se fait limiter en débit dès la
 * deuxième requête chez certains registres (SIDN pour .nl), ou disparaît
 * purement et simplement (.app et .dev depuis le retrait du port 43, .shop
 * depuis mai 2026), RDAP répond en HTTPS, sans clé d'API, de façon uniforme.
 *
 * La couverture reste partielle : les ccTLD n'ont aucune obligation de
 * publier un serveur RDAP (.de, .it, .es, .ch, .hu… n'en ont pas). D'où le
 * repli WHOIS conservé dans DomainService — RDAP d'abord, WHOIS ensuite.
 */
@Injectable()
export class RdapService {
  private readonly logger = new Logger(RdapService.name);
  /** TLD sans point (« com ») → URL de base du serveur RDAP, barre finale incluse. */
  private servers = new Map<string, string>();
  private loadedAt = 0;
  /** Chargements concurrents mutualisés : au démarrage, dix candidats arrivent ensemble. */
  private loading: Promise<void> | null = null;
  /**
   * Date avant laquelle on ne retente pas l'annuaire après un échec. Sans ce
   * garde-fou, une panne d'IANA ferait retenter le chargement à chaque nom
   * vérifié — soit, sur une recherche réelle, des centaines d'attentes de 8 s.
   */
  private retryAfter = 0;

  /**
   * `true` libre, `false` pris, `null` si RDAP ne peut pas trancher — TLD sans
   * serveur déclaré, quota dépassé, panne. L'appelant se rabat alors sur WHOIS.
   */
  async lookup(domain: string): Promise<boolean | null> {
    const tld = domain.slice(domain.lastIndexOf('.') + 1).toLowerCase();
    if (!tld) return null;

    const base = await this.serverFor(tld);
    if (!base) return null;

    try {
      const res = await this.fetchWithTimeout(`${base}domain/${encodeURIComponent(domain)}`);
      // Le contrat RDAP tient en deux codes : l'objet existe, ou non.
      if (res.status === 404) return true;
      if (res.status === 200) return false;
      // 429 (quota), 5xx, 403… : pas de verdict, on laisse WHOIS tenter.
      return null;
    } catch {
      // Délai dépassé, DNS, TLS : idem, aucun verdict.
      return null;
    }
  }

  private async serverFor(tld: string): Promise<string | null> {
    const now = Date.now();
    if (now - this.loadedAt > BOOTSTRAP_TTL_MS && now >= this.retryAfter) {
      await this.loadBootstrap();
    }
    return this.servers.get(tld) ?? null;
  }

  private async loadBootstrap(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = this.doLoadBootstrap().finally(() => { this.loading = null; });
    return this.loading;
  }

  private async doLoadBootstrap(): Promise<void> {
    try {
      const res = await this.fetchWithTimeout(BOOTSTRAP_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json() as { services?: [string[], string[]][] };

      const servers = new Map<string, string>();
      for (const [tlds, urls] of body.services ?? []) {
        // Un service peut publier plusieurs URL (http et https) : on retient la
        // première en HTTPS, sinon la première tout court.
        const url = urls.find(u => u.startsWith('https://')) ?? urls[0];
        if (!url) continue;
        const base = url.endsWith('/') ? url : `${url}/`;
        for (const tld of tlds) servers.set(tld.toLowerCase(), base);
      }

      if (servers.size === 0) throw new Error('annuaire vide');
      this.servers = servers;
      this.loadedAt = Date.now();
      this.logger.log(`Annuaire RDAP chargé : ${servers.size} TLD`);
    } catch (err: any) {
      // Sans annuaire, `servers` reste vide et tout repart sur WHOIS. On le
      // journalise, car ce repli silencieux ramènerait les faux verdicts que
      // RDAP est précisément là pour supprimer.
      this.logger.warn(`Annuaire RDAP indisponible, repli WHOIS intégral : ${err?.message ?? err}`);
      // Nouvelle tentative dans une minute, pas au prochain nom vérifié.
      this.retryAfter = Date.now() + BOOTSTRAP_RETRY_MS;
    }
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, {
        signal: abort.signal,
        headers: { Accept: 'application/rdap+json, application/json' },
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
