import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, PLATFORM_ID, InjectionToken, LOCALE_ID } from '@angular/core';
import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Sans cet enregistrement, `DatePipe` formate en en-US : « 19 Aug » au lieu de
// « 19 août » sur les cartes vérifiées. Les deux langues du site sont fr et en ;
// `en` est le défaut d'Angular, seul `fr` doit être ajouté.
registerLocaleData(localeFr);
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { of, firstValueFrom } from 'rxjs';
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

/**
 * Langues dont l'accueil existe VRAIMENT : il a une URL prérendue, ses
 * métadonnées et son contenu dans cette langue. Les 17 autres langues de
 * l'interface restent servies côté client, mais n'ont pas d'URL propre —
 * leur donner un `/de/` qui servirait du français créerait du contenu
 * dupliqué, ce que Google pénalise. À étendre langue par langue, quand le
 * contenu existe.
 */
export const SITE_LANGS = ['fr', 'en'] as const;
export type SiteLang = (typeof SITE_LANGS)[number];

/** Langue portée par l'URL (« /en », « /en/… »), `fr` par défaut — la racine est française. */
export function langFromPath(path: string): SiteLang {
  const seg = path.split('?')[0].split('#')[0].split('/').filter(Boolean)[0];
  return (SITE_LANGS as readonly string[]).includes(seg) ? (seg as SiteLang) : 'fr';
}

/**
 * Dictionnaires i18n fournis au PRERENDER, lus sur le disque par le bundle
 * serveur (voir `app.config.server.ts`). Vide côté navigateur. C'est ce qui
 * permet de prérendre l'accueil en anglais avec son vrai contenu, et non des
 * clés brutes — sans jamais embarquer `fs` dans le bundle client.
 */
export const PRERENDER_I18N = new InjectionToken<Record<string, unknown>>('PRERENDER_I18N', {
  providedIn: 'root',
  factory: () => ({}),
});

export class CustomTranslateLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    private isBrowser: boolean,
    private prerendered: Record<string, unknown> = {},
  ) {}
  getTranslation(lang: string): Observable<any> {
    // Au prerender (SSG), aucune requête HTTP n'est possible : on sert le
    // dictionnaire chargé sur disque par le bundle serveur, ou rien.
    if (!this.isBrowser) return of(this.prerendered[lang] ?? {});

    // Chemin ABSOLU, impérativement. En relatif, « ./assets/… » se résout
    // contre l'URL courante : depuis /guides/xxx ou /projects/:id, la requête
    // partait vers /guides/assets/i18n/de.json, où le fallback SPA de nginx
    // renvoie index.html avec un code 200. ngx-translate recevait donc du HTML
    // au lieu du JSON, échouait sans bruit, et changer de langue ne faisait
    // plus rien dès qu'on n'était pas à la racine.
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

export function HttpLoaderFactory(http: HttpClient, platformId: Object, prerendered: Record<string, unknown>) {
  return new CustomTranslateLoader(http, isPlatformBrowser(platformId), prerendered);
}

/**
 * Délai au-delà duquel on cesse d'attendre Keycloak au démarrage.
 *
 * 8 s : assez pour une connexion lente ou un serveur qui s'éveille, assez
 * court pour qu'un utilisateur n'ait pas le sentiment d'une page morte.
 */
const KEYCLOAK_INIT_TIMEOUT_MS = 8000;

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
    // pas de navigator. Français par défaut ; une page anglaise (« /en ») bascule
    // elle-même la langue depuis sa route — au prerender statique il n'y a pas
    // de requête HTTP, donc `REQUEST` est nul et l'APP_INITIALIZER ne connaît
    // pas l'URL. Le dictionnaire étant déjà en mémoire (`PRERENDER_I18N`), la
    // bascule dans le composant est synchrone.
    if (!isPlatformBrowser(platformId)) {
      await firstValueFrom(translate.use('fr'));
      return;
    }

    // 1. Charger la config runtime (URLs d'env)
    await config.load();

    // 2. Initialiser Keycloak
    //
    // Le try/catch évite une page blanche sur Safari : ITP bloque l'iframe du
    // silent check-sso (Storage Access API), ce qui fait échouer keycloak.init()
    // et gèle l'APP_INITIALIZER si l'erreur n'est pas capturée.
    //
    // Mais il ne suffit pas : quand l'iframe est bloquée par une CSP
    // `frame-ancestors` plutôt que par une erreur réseau, `keycloak.init()` ne
    // rejette PAS — il attend un postMessage qui n'arrivera jamais. La promesse
    // reste alors en suspens, l'APP_INITIALIZER ne se résout jamais, et
    // l'application ne démarre pas : la page prérendue reste affichée, d'aspect
    // normal, mais AUCUN élément n'est interactif. C'est un mode de panne
    // silencieux, et d'autant plus trompeur que la page paraît correcte.
    //
    // D'où la course contre un délai : au-delà, on charge en mode non
    // authentifié, exactement comme le fait déjà le catch en cas d'échec.
    // Mieux vaut une application utilisable où l'utilisateur doit cliquer sur
    // « Connexion » qu'une application figée.
    try {
      await Promise.race([
        keycloak.init({
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
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('keycloak init timeout')), KEYCLOAK_INIT_TIMEOUT_MS),
        ),
      ]);
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

    // 3. Langue : l'URL prime (« /en » est une page anglaise, quoi qu'en dise
    // le navigateur) ; sinon, détection depuis le navigateur comme avant.
    const urlLang = window.location.pathname.split('/').filter(Boolean)[0];
    if ((SITE_LANGS as readonly string[]).includes(urlLang)) {
      translate.use(urlLang);
      return;
    }
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
    // La langue d'affichage des dates suit l'URL, comme le reste du site.
    { provide: LOCALE_ID, useFactory: () => (typeof window !== 'undefined' && window.location.pathname.split('/')[1] === 'en' ? 'en' : 'fr') },
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
                // MÊME attribut que celui posé par ThemeService et par le
                // script synchrone d'index.html. Sans cela, p-select, p-dialog,
                // p-drawer, p-chip et les tooltips resteraient clairs quoi que
                // fassent nos jetons : deux thèmes superposés.
                //
                // Les surfaces choisies pour des raisons éditoriales — héros de
                // l'accueil, CTA final, encart de démonstration — ne basculent
                // pas pour autant : elles portent les jetons `--nm-*-dark` en
                // dur, indépendamment du mode.
                darkModeSelector: '[data-theme="dark"]'
            }
        }
    }),
    // ngx-translate 18 a retiré `TranslateModule` : la configuration passe par
    // des providers autonomes, et les composants importent `TranslatePipe`.
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, PLATFORM_ID, PRERENDER_I18N]
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
