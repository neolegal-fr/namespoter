import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';
import { WizardComponent } from './components/wizard/wizard';

/**
 * Garde UNE seule instance du wizard entre `/app` et `/projects/:id`.
 *
 * Ces deux chemins sont deux entrées de route distinctes qui rendent le même
 * composant. Par défaut Angular ne réutilise une instance que si l'objet de
 * configuration est identique : ouvrir un projet depuis `/app` détruisait donc
 * le wizard pour en recréer un aussitôt. Deux conséquences, l'une visible :
 *
 * - le tiroir des projets accroche son voile à `document.body`, hors de la vue
 *   du composant, et ne le retire qu'à la fin de son animation de sortie.
 *   Détruit avant la fin, il laissait le voile derrière lui : la page restait
 *   grisée et insensible aux clics jusqu'au prochain F5 ;
 * - le projet était chargé deux fois — une fois par l'instance condamnée,
 *   une fois par la nouvelle.
 *
 * Réutiliser l'instance supprime les deux d'un coup, et le changement d'`id`
 * arrive par `route.params`, auquel le wizard est déjà abonné.
 *
 * La règle est volontairement étroite. `LandingComponent` sert aussi deux
 * routes (`/` et `/en`) mais y décide sa langue à la construction : les
 * réutiliser servirait de l'anglais sur `/` après un passage par `/en`.
 */
@Injectable()
export class WizardReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.component === WizardComponent && curr.component === WizardComponent) {
      return true;
    }
    return super.shouldReuseRoute(future, curr);
  }
}
