import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyticsService } from './analytics';
import { ConfigService } from './config';

/**
 * Ajoute l'identifiant de visite anonyme aux appels de NOTRE API.
 *
 * L'entonnoir du tableau de bord se compte par visite : sans cet en-tête, le
 * serveur verrait bien qu'une recherche a été lancée, mais serait incapable de
 * la rattacher au visiteur qui est arrivé sur le site — donc de dire sur
 * combien de visiteurs une recherche est lancée.
 *
 * L'identifiant vit en `sessionStorage`, ne survit pas à la fermeture de
 * l'onglet, et ne désigne personne : c'est ce qui permet de mesurer sans
 * cookie, et donc sans consentement, ceux qui repartent le plus tôt.
 *
 * **Seulement vers l'API.** Un en-tête inattendu déclenche une vérification
 * préalable (CORS) : l'envoyer à Keycloak, à `/assets` ou à un tiers ferait
 * échouer des requêtes qui fonctionnent aujourd'hui.
 */
@Injectable()
export class SessionIdInterceptor implements HttpInterceptor {
  private readonly analytics = inject(AnalyticsService);
  private readonly config = inject(ConfigService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const api = this.config.apiUrl;
    if (!api || !req.url.startsWith(api)) return next.handle(req);

    const sid = this.analytics.sessionId;
    if (!sid) return next.handle(req);

    return next.handle(req.clone({ setHeaders: { 'X-Session-Id': sid } }));
  }
}
