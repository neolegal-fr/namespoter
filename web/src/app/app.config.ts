import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { of } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { importProvidersFrom } from '@angular/core';
import { Observable } from 'rxjs';

import { routes } from './app.routes';
import { ConfigService } from './services/config';
import { SessionKeeperService } from './services/session-keeper';
import { AnalyticsService } from './services/analytics';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient, private isBrowser: boolean) {}
  getTranslation(lang: string): Observable<any> {
    // Au prerender (SSG), l'URL relative des fichiers i18n n'est pas résolvable
    // côté serveur : on renvoie un dictionnaire vide. La landing prérendue
    // affiche du texte écrit en dur ; les traductions du shell sont chargées
    // côté client après hydratation.
    if (!this.isBrowser) return of({});
    return this.http.get(`./assets/i18n/${lang}.json`);
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
    translate.setDefaultLang('fr');

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
            preset: Aura,
            options: {
                darkModeSelector: false
            }
        }
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient, PLATFORM_ID]
        }
      })
    ),
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
