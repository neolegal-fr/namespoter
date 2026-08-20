import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Les trois contrôles, et ce qu'on risque à en sauter deux.
 *
 * Bloc partagé par les guides et les pages génératrices. Il est écrit UNE fois
 * et repris tel quel, à dessein : c'est l'argument central du produit, et le
 * laisser dériver d'une page à l'autre l'affaiblirait. Chaque page l'introduit
 * avec ses propres mots (`intro`), ce qui évite d'ouvrir quinze articles sur
 * la même phrase.
 *
 * La progression n'est pas décorative : elle va du plus VISIBLE au plus
 * COÛTEUX. Le domaine se voit tout de suite et se remplace en une journée ; le
 * pseudo se voit moins et se remplace mal ; la marque ne se voit pas du tout
 * et, quand elle se manifeste, elle arrive par lettre d'avocat — au moment
 * précis où le projet commence à marcher, puisque c'est ce qui la déclenche.
 */
@Component({
  selector: 'app-trois-risques',
  standalone: true,
  imports: [RouterModule],
  template: `
    <section class="risques" aria-labelledby="trois-risques-titre">
      <h2 id="trois-risques-titre" class="risques__titre">{{ heading }}</h2>
      <p class="risques__lead">{{ intro }}</p>

      <ol class="risques__liste">
        <li>
          <h3>1. Le nom de domaine — le plus visible, le moins engageant</h3>
          <p>
            C'est le seul contrôle que tout le monde fait, parce que c'est le seul qui se voit
            tout de suite : le <code>.com</code> est pris ou il ne l'est pas. C'est aussi celui
            qui coûte le moins cher à corriger. Un domaine indisponible vous fait perdre une
            heure de recherche ; il ne vous fait pas perdre votre marque.
          </p>
        </li>

        <li>
          <h3>2. Les réseaux sociaux — un risque de visibilité</h3>
          <p>
            Un pseudo déjà pris n'empêche pas de lancer le projet, mais il fragmente
            durablement votre présence : vous devenez <em>@marque</em> ici,
            <em>@marque_officiel</em> là, <em>@marquefr</em> ailleurs. Vos clients ne vous
            trouvent pas du premier coup, vos mentions se dispersent, et une partie de votre
            audience atterrit chez un homonyme. Aucune plateforme ne vous rendra un pseudo
            occupé, même inactif depuis des années : la plupart n'ont pas de procédure de
            réclamation en dehors des cas de contrefaçon avérée.
          </p>
        </li>

        <li>
          <h3>3. La marque déposée — un risque juridique, et un changement de nom</h3>
          <p>
            C'est le contrôle qu'on saute le plus souvent, et le seul dont les conséquences ne
            se rattrapent pas. Utiliser un nom déjà déposé dans vos classes de produits ou de
            services vous expose à une <strong>opposition</strong>, puis à une action en
            <strong>contrefaçon</strong> : mise en demeure, retrait de vos supports, parfois
            dommages et intérêts.
          </p>
          <p>
            Le coût réel n'est pourtant pas juridique, il est opérationnel. Changer de nom une
            fois le projet lancé, c'est refaire le site, les enseignes, les emballages, les
            comptes sociaux, les contrats, les cartes de visite — et repartir de zéro sur le
            référencement et la notoriété acquise. Et cela arrive presque toujours <em>tard</em> :
            un titulaire de marque agit quand vous devenez visible, c'est-à-dire quand le projet
            commence enfin à marcher.
          </p>
        </li>
      </ol>

      <p class="risques__chute">
        D'où une règle simple : <strong>mieux vaut être déçu tôt</strong>. Apprendre aujourd'hui
        que le nom qu'on aime est déjà déposé coûte quelques minutes et un peu de moral. Le
        découvrir dans deux ans coûte le nom lui-même, et tout ce qu'on a construit autour.
        <a routerLink="/app">Vérifiez les trois d'un coup</a> avant de vous attacher.
      </p>
    </section>
  `,
  styles: [`
    .risques {
      margin: 2.5rem 0;
      padding: 1.75rem 1.5rem;
      border: 1px solid var(--nm-app-border);
      border-radius: 0.9rem;
      background: var(--nm-app-surface-alt);
    }
    .risques__titre { margin: 0 0 0.5rem; font-size: 1.35rem; font-weight: 700; }
    .risques__lead { margin: 0 0 1.25rem; color: var(--nm-app-text-2); }
    .risques__liste { margin: 0; padding: 0; list-style: none; counter-reset: none; }
    .risques__liste > li { margin: 0 0 1.25rem; }
    .risques__liste h3 { margin: 0 0 0.4rem; font-size: 1.02rem; font-weight: 700; }
    .risques__liste p { margin: 0 0 0.5rem; line-height: 1.6; }
    .risques__chute {
      margin: 0;
      padding-top: 1rem;
      border-top: 1px solid var(--nm-app-divider);
      line-height: 1.6;
    }
  `],
})
export class TroisRisquesComponent {
  @Input() heading = 'Trois contrôles, trois risques très différents';

  /** Chaque page l'écrit à sa façon : quinze articles ne s'ouvrent pas pareil. */
  @Input() intro =
    "Le domaine est le contrôle le plus visible — c'est aussi celui dont l'échec coûte le moins cher.";
}
