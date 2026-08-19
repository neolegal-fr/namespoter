import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { appConfig, PRERENDER_I18N, SITE_LANGS } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Dictionnaires i18n des langues du site, lus UNE fois sur le disque au
 * démarrage du prerender. Ce fichier n'est jamais embarqué dans le bundle
 * navigateur : c'est le seul endroit où `fs` est permis.
 *
 * Seules les langues de `SITE_LANGS` sont chargées — les autres n'ont pas
 * d'URL prérendue et n'en ont donc pas besoin ici.
 */
function loadPrerenderI18n(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const lang of SITE_LANGS) {
    try {
      out[lang] = JSON.parse(readFileSync(join(process.cwd(), 'public', 'assets', 'i18n', `${lang}.json`), 'utf8'));
    } catch {
      // Fichier absent : la langue se rendra en clés brutes, ce qui se voit
      // immédiatement au build plutôt que de casser silencieusement.
    }
  }
  return out;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: PRERENDER_I18N, useValue: loadPrerenderI18n() },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
