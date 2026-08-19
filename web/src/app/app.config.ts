import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { of } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { ConfirmationService, MessageService } from 'primeng/api';
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { importProvidersFrom } from '@angular/core';
import { Observable } from 'rxjs';

import { routes } from './app.routes';
import { ConfigService } from './services/config';
import { SessionKeeperService } from './services/session-keeper';
import { AnalyticsService } from './services/analytics';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient, private isBrowser: boolean) {}
  getTranslation(lang: string): Observable<any> {
    // Au prerender (SSG), rien n'est résolvable côté serveur : on renvoie un
    // dictionnaire vide. La landing prérendue affiche du texte écrit en dur ;
    // les traductions du shell sont chargées côté client après hydratation.
    if (!this.isBrowser) return of({});

    // Chemin ABSOLU, impérativement. En relatif, « ./assets/… » se résout
    // contre l'URL courante : depuis /guides/xxx ou /projects/:id, la requête
    // partait vers /guides/assets/i18n/de.json, où le fallback SPA de nginx
    // renvoie index.html avec un code 200. ngx-translate recevait donc du HTML
    // au lieu du JSON, échouait sans bruit, et changer de langue ne faisait
    // plus rien dès qu'on n'était pas à la racine.
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

export function HttpLoaderFactory(http: HttpClient, platformId: Object) {
  return new CustomTranslateLoader(http, isPlatformBrowser(platformId));
}

function initializeApp(
  keycloak: KeycloakService,
  translate: TranslateService,
  config: ConfigService,
  platformId: Object,
  sessionKeeper: SessionKeeperService,
  analytics: AnalyticsService,
) {
  return async () => {
    const supportedLangs = ['cs', 'da', 'de', 'en', 'es', 'fi', 'fr', 'hu', 'it', 'ja', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sv', 'tr', 'zh'];
    translate.addLangs(supportedLangs);
    translate.setFallbackLang('fr');

    // Côté serveur (prerender SSG) : pas de Keycloak, pas de fetch relatif,
    // pas de navigator. On rend la landing en français par défaut.
    if (!isPlatformBrowser(platformId)) {
      translate.use('fr');
      return;
    }

    // 1. Charger la config runtime (URLs d'env)
    await config.load();

    // 2. Initialiser Keycloak
    // Le try/catch évite une page blanche sur Safari : ITP bloque l'iframe du
    // silent check-sso (Storage Access API), ce qui fait échouer keycloak.init()
    // et gèle l'APP_INITIALIZER si l'erreur n'est pas capturée.
    try {
      await keycloak.init({
        config: {
          url: config.keycloakUrl,
          realm: 'namorama',
          clientId: 'namorama-web'
        },
        initOptions: {
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri:
            window.location.origin + '/assets/silent-check-sso.html',
          checkLoginIframe: false
        },
        bearerExcludedUrls: ['/assets']
      });
    } catch {
      // SSO check bloqué (Safari ITP, navigateur sans cookies tiers, etc.)
      // L'app charge en mode non-authentifié ; l'utilisateur peut se connecter manuellement.
    }

    // 2 bis. Renouvellement périodique du jeton tant que l'onglet est utilisé,
    // pour ne pas tomber sur le timeout d'inactivité entre deux appels API.
    sessionKeeper.start();

    // Remonte les erreurs JavaScript non capturées : sans ça, un plantage du
    // front ne laisse aucune trace côté serveur.
    analytics.installErrorReporting();

    // 3. Langue depuis le navigateur
    const browserLang = translate.getBrowserLang() ?? '';
    translate.use(supportedLangs.includes(browserLang) ? browserLang : 'fr');
  };
}

/**
 * Préréglage PrimeNG aligné sur les tokens de la refonte.
 *
 * Sans cela, les tokens `--nm-*` ne toucheraient que le code écrit à la main :
 * les boutons, champs et badges PrimeNG resteraient sur l'émeraude `#10b981`
 * de l'ancienne marque, et deux verts cohabiteraient à l'écran.
 *
 * Les valeurs sont écrites en dur plutôt qu'en `var(--nm-…)` : PrimeNG dérive
 * ses propres jetons de cette palette (survols, états désactivés, halos de
 * focus) par des calculs de couleur, et ne sait pas le faire depuis une
 * référence CSS non résolue.
 *
 * L'échelle est construite autour des deux accents du design — `#3ddc91` pour
 * les surfaces sombres, `#0d9a63` pour les surfaces claires — placés
 * respectivement en 400 et 600, et non l'un des deux étiré sur dix nuances.
 */
const NamoramaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#eafaf2',
      100: '#c9f3de',
      200: '#a3ebc8',
      300: '#6ee7a8',  // --nm-accent-hover
      400: '#3ddc91',  // --nm-accent — surfaces sombres
      500: '#16c47a',
      600: '#0d9a63',  // --nm-accent-on-light — surfaces claires (AA sur blanc)
      700: '#0b8355',  // --nm-accent-on-light-hover
      800: '#0a6b46',
      900: '#075437',
      950: '#062018',  // --nm-on-accent
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Par défaut, Angular conserve la position de défilement d'une route à
    // l'autre : un lien situé en bas de la page d'accueil ouvrait donc la page
    // suivante à la même hauteur, c'est-à-dire au milieu ou en bas de l'article.
    // 'enabled' remet en haut à chaque nouvelle navigation, tout en restaurant
    // la position d'origine lors d'un retour arrière.
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideAnimations(),
    providePrimeNG({
        theme: {
            preset: NamoramaPreset,
            options: {
                // La refonte n'est pas « un mode sombre » : l'accueil et les
                // résultats sont sombres, le rapport est clair, dans la même
                // session. Les surfaces sont donc portées par les jetons
                // `--nm-*`, pas par une bascule globale de thème — qui
                // inverserait aussi le rapport, à tort.
                darkModeSelector: false
            }
        }
    }),
    // ngx-translate 18 a retiré `TranslateModule` : la configuration passe par
    // des providers autonomes, et les composants importent `TranslatePipe`.
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, PLATFORM_ID]
      }
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
      deps: [KeycloakService, TranslateService, ConfigService, PLATFORM_ID, SessionKeeperService, AnalyticsService]
    },
    KeycloakService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true
    },
    ConfirmationService,
    MessageService
  ]
};
