import type { Availability } from '../dto/brand-report.types';

/**
 * Un adaptateur par plateforme : le spike US-050 a montré que le « 200 = pris /
 * 404 = libre » uniforme est FAUX (la plupart des réseaux sont des SPA qui
 * renvoient 200 même pour un pseudo inexistant). Chaque plateforme a donc sa
 * propre stratégie, isolée et remplaçable.
 */
export interface PlatformAdapter {
  platform: string;
  /** URL du profil (affichée quand le pseudo est pris). */
  profileUrl(handle: string): string;
  /** Détermine la disponibilité. Toute incertitude → `unknown`, jamais un faux « libre ». */
  check(handle: string, http: SocialHttp): Promise<Availability>;
  /** Adaptateur pas encore livré (Phase 1.5/2 du spike) → renvoie toujours `unknown`. */
  planned?: boolean;
}

/** Petit client HTTP borné en temps, injecté aux adaptateurs (testable via mock). */
export interface SocialHttp {
  status(url: string, opts?: { redirect?: 'follow' | 'manual' }): Promise<number>;
  text(url: string): Promise<string>;
}

/**
 * Phase 1 — plateformes vérifiables de façon fiable et gratuite (spike US-050).
 * Phase 1.5/2 (Pinterest, Reddit, Twitch, YouTube, Instagram, X, Facebook) :
 * déclarées `planned` → `unknown` explicite tant que leur adaptateur manque.
 */
export const PLATFORM_ADAPTERS: PlatformAdapter[] = [
  {
    // 404 sur un profil inexistant, 200 sinon — fiable en direct.
    platform: 'GitHub',
    profileUrl: (h) => `https://github.com/${h}`,
    async check(h, http) {
      const code = await http.status(`https://github.com/${h}`);
      if (code === 404) return 'free';
      if (code === 200) return 'taken';
      return 'unknown';
    },
  },
  {
    // Page « company » : 404 si le vanity name est libre.
    platform: 'LinkedIn',
    profileUrl: (h) => `https://www.linkedin.com/company/${h}`,
    async check(h, http) {
      const code = await http.status(`https://www.linkedin.com/company/${h}`);
      if (code === 404) return 'free';
      if (code === 200) return 'taken';
      return 'unknown';
    },
  },
  {
    // t.me répond 200 dans tous les cas (spike). Discriminant = le contenu :
    // une page de profil réelle porte tgme_page_title/_extra/_photo ; un pseudo
    // libre renvoie la page générique Telegram.
    platform: 'Telegram',
    profileUrl: (h) => `https://t.me/${h}`,
    async check(h, http) {
      const body = await http.text(`https://t.me/${h}`);
      if (!body.includes('tgme_page')) return 'unknown'; // page inattendue (blocage/erreur)
      if (/tgme_page_title|tgme_page_extra|tgme_page_photo/.test(body)) return 'taken';
      return 'free';
    },
  },
  {
    // SPA : status inexploitable. Marqueur dans le corps (spike US-050) —
    // profil pris → "userInfo" présent ; libre → "statusCode":10221.
    platform: 'TikTok',
    profileUrl: (h) => `https://www.tiktok.com/@${h}`,
    async check(h, http) {
      const body = await http.text(`https://www.tiktok.com/@${h}`);
      if (body.includes('"userInfo"')) return 'taken';
      if (body.includes('"statusCode":10221')) return 'free';
      return 'unknown';
    },
  },

  {
    // x.com renvoie 404 pour un pseudo inexistant, 200 sinon (redirection suivie).
    platform: 'X',
    profileUrl: (h) => `https://x.com/${h}`,
    async check(h, http) {
      const code = await http.status(`https://x.com/${h}`);
      if (code === 404) return 'free';
      if (code === 200) return 'taken';
      return 'unknown';
    },
  },
  {
    // youtube.com/@handle : 404 si le handle est libre, 200 sinon.
    platform: 'YouTube',
    profileUrl: (h) => `https://www.youtube.com/@${h}`,
    async check(h, http) {
      const code = await http.status(`https://www.youtube.com/@${h}`);
      if (code === 404) return 'free';
      if (code === 200) return 'taken';
      return 'unknown';
    },
  },

  // --- Phase 2 : mur de connexion / anti-bot, pas de verdict fiable ---
  planned('Instagram', (h) => `https://www.instagram.com/${h}`),
  planned('Facebook', (h) => `https://www.facebook.com/${h}`),
];

/** Adaptateur « planifié » : contrat visible dans le rapport, statut toujours `unknown`. */
function planned(platform: string, profileUrl: (h: string) => string): PlatformAdapter {
  return { platform, profileUrl, planned: true, check: async () => 'unknown' };
}
