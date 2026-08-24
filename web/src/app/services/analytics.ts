import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConfigService } from './config';

declare function gtag(...args: any[]): void;

/**
 * Traçage du parcours utilisateur.
 *
 * Deux destinations, volontairement :
 * - **notre API** (`POST /events`), toujours appelée. Anonyme, sans cookie :
 *   un identifiant de session éphémère vit en `sessionStorage` et disparaît à
 *   la fermeture de l'onglet. C'est ce qui permet de mesurer les abandons de
 *   ceux qui refusent les cookies — c'est-à-dire, justement, ceux qui partent
 *   le plus tôt ;
 * - **Google Analytics**, si présent et si le consentement a été donné (le
 *   Consent Mode s'en charge), pour les tableaux de bord d'audience.
 *
 * Le traçage ne doit jamais gêner l'utilisateur : tout échec est ignoré, et
 * l'envoi passe par `sendBeacon` quand c'est possible pour survivre à une
 * navigation immédiate.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(ConfigService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Identifiant de la visite en cours, créé au besoin.
   *
   * Public : l'intercepteur HTTP le pose sur chaque appel à l'API, pour que le
   * serveur puisse rattacher une recherche ou une inscription à la visite qui
   * les a produites. Vide hors navigateur (prerender).
   */
  get sessionId(): string {
    if (!this.isBrowser) return '';
    let id = sessionStorage.getItem('nm_sid');
    if (!id) {
      id = (crypto.randomUUID?.() ?? String(Date.now() + Math.random())).slice(0, 36);
      sessionStorage.setItem('nm_sid', id);
    }
    return id;
  }

  /**
   * Enregistre l'affichage d'une page.
   *
   * C'est le SEUL événement qui compte une visite, et donc le dénominateur de
   * tout l'entonnoir : sans lui, quelqu'un qui arrive, lit et repart ne laisse
   * aucune trace nulle part — ni dans les logs, ni dans Google Analytics, qui
   * ne voit que ceux ayant accepté la bannière.
   *
   * `connecte` distingue les visites arrivées avec une session déjà ouverte :
   * elles ne peuvent pas créer de compte, et gonfleraient le dénominateur du
   * taux d'inscription.
   */
  pageView(path: string, connecte: boolean): void {
    this.track('page_viewed', { path, connecte });
  }

  /** Enregistre une étape de parcours ou une action notable. */
  track(name: string, meta: Record<string, unknown> = {}): void {
    if (!this.isBrowser) return;

    try {
      const body = JSON.stringify({ name, sessionId: this.sessionId, meta });
      const url = `${this.config.apiUrl}/events`;

      // sendBeacon survit à une navigation ou à une fermeture d'onglet, ce que
      // fetch ne garantit pas — indispensable pour tracer un abandon.
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        void fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* le traçage ne doit jamais interrompre le parcours */
    }

    try {
      if (typeof gtag === 'function') gtag('event', name, meta);
    } catch {
      /* GA absent ou bloqué par un adblocker : sans conséquence */
    }
  }

  /**
   * Remonte les erreurs JavaScript non capturées : ce sont celles que
   * l'utilisateur subit sans qu'aucune trace n'arrive côté serveur.
   */
  installErrorReporting(): void {
    if (!this.isBrowser) return;

    window.addEventListener('error', (e) => {
      /*
       * « Script error. » sans fichier ni ligne n'est pas une erreur du
       * produit : c'est ce que le navigateur affiche quand le script fautif
       * vient d'une AUTRE origine sans en-tête CORS — une extension du
       * navigateur, un traceur tiers. Le détail est masqué par sécurité, et
       * aucun réglage de notre côté ne le révélera.
       *
       * On le dit dans l'événement plutôt que de laisser cinq lignes
       * indéchiffrables se lire comme cinq bogues à corriger. Et quand
       * l'erreur vient bien de notre code, la pile part avec : c'est elle qui
       * permet de retrouver l'appel, le nom de fichier minifié ne suffisant
       * pas.
       */
      const masquee = e.message === 'Script error.' && !e.filename;
      this.track('client_error', {
        message: e.message,
        source: `${e.filename}:${e.lineno}`,
        origin: masquee ? 'externe' : 'application',
        stack: String((e.error as Error | undefined)?.stack ?? '').slice(0, 300),
        path: location.pathname,
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      this.track('client_unhandled_rejection', {
        message: String((e.reason as any)?.message ?? e.reason).slice(0, 300),
        path: location.pathname,
      });
    });
  }
}
