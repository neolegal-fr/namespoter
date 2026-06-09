import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Render modes par route pour la génération statique (SSG).
 *
 * Seule la landing page ('') est prérendue en HTML statique : c'est la page
 * de contenu indexée par Google. Tout le reste (wizard, admin, paiement…)
 * reste en rendu client (`RenderMode.Client`) — leur code dépendant du
 * navigateur (Keycloak, localStorage, gtag) ne s'exécute donc jamais au build.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
