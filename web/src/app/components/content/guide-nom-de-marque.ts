import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Article pilier : guide pratique pour trouver un nom de marque disponible.
 * Page prérendue (SSG) ciblant les requêtes informationnelles « trouver un nom
 * de marque », « idée de nom d'entreprise », « nom de marque disponible ».
 */
@Component({
  selector: 'app-guide-nom-de-marque',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; Guides &rsaquo; Trouver un nom de marque
      </nav>

      <h1>Comment trouver un nom de marque disponible (avec son domaine) ?</h1>
      <p class="lead">
        Trouver un nom de marque, c'est facile. En trouver un qui soit à la fois mémorable,
        pertinent <strong>et dont le nom de domaine est encore libre</strong>, beaucoup moins.
        Voici une méthode en 5 étapes, et comment l'IA de Namorama l'accélère.
      </p>

      <h2 id="pourquoi-cest-dur">Pourquoi c'est si difficile aujourd'hui</h2>
      <p>
        Des centaines de millions de domaines sont déjà enregistrés. La plupart des noms
        « évidents » pour votre secteur sont pris depuis longtemps. Résultat : on trouve un
        beau nom… avant de découvrir que le <code>.com</code> est occupé, ou pire, déposé
        comme marque. Le bon réflexe est donc d'inverser la démarche : générer largement,
        puis filtrer immédiatement sur la disponibilité réelle.
      </p>

      <h2 id="methode">La méthode en 5 étapes</h2>
      <h3>1. Clarifiez votre positionnement</h3>
      <p>
        Avant de chercher des mots, posez votre projet en une phrase : que vendez-vous,
        à qui, avec quelle promesse ? Un bon nom traduit une intention. Notez aussi le ton
        recherché (sérieux, joueur, technique, premium…).
      </p>
      <h3>2. Explorez plusieurs pistes créatives</h3>
      <p>Les noms de marque qui fonctionnent relèvent en général d'une de ces familles :</p>
      <ul>
        <li><strong>Évocateurs</strong> — suggèrent un bénéfice ou une sensation (ex. Stripe, Slack).</li>
        <li><strong>Inventés</strong> — mots-valises ou néologismes uniques et déposables (ex. Spotify, Zalando).</li>
        <li><strong>Descriptifs détournés</strong> — un mot concret utilisé hors de son sens premier (ex. Amazon, Apple).</li>
        <li><strong>Composés</strong> — deux racines fusionnées qui racontent l'usage (ex. Namorama, Facebook).</li>
      </ul>
      <h3>3. Vérifiez la disponibilité du domaine — tout de suite</h3>
      <p>
        C'est l'étape que la plupart des gens repoussent à tort. Tester la disponibilité au
        fil de l'eau évite de tomber amoureux d'un nom inaccessible. Privilégiez une
        vérification <strong>Whois réelle</strong> plutôt qu'une simple estimation : seule la
        requête au registre dit si un domaine est vraiment réservable à l'instant T.
      </p>
      <h3>4. Filtrez sur la prononciation et la mémorisation</h3>
      <p>
        Lisez chaque candidat à voix haute. Est-il facile à épeler au téléphone ? Évitez les
        doubles sens malheureux et vérifiez qu'il « passe » aussi dans les autres langues de
        vos marchés cibles.
      </p>
      <h3>5. Sécurisez le nom</h3>
      <p>
        Une fois le bon nom trouvé et le domaine libre confirmé, réservez le domaine sans
        attendre chez votre registrar, et vérifiez l'antériorité de marque (INPI en France,
        EUIPO en Europe) avant tout dépôt.
      </p>

      <app-article-cta
        heading="Laissez l'IA générer et vérifier à votre place"
        subheading="Décrivez votre projet : Namorama propose des dizaines de noms et teste leur disponibilité en domaine en temps réel.">
      </app-article-cta>

      <h2 id="namorama">Comment Namorama accélère chaque étape</h2>
      <p>
        Namorama réunit la génération créative et la vérification de disponibilité au même
        endroit, pour supprimer les allers-retours :
      </p>
      <ul>
        <li><strong>Reformulation par l'IA</strong> — votre description est analysée pour
          extraire l'univers de marque et des mots-clés exploitables.</li>
        <li><strong>Génération de noms originaux</strong> — l'IA propose des candidats
          inventifs, prononçables et adaptés à votre secteur, au-delà des évidences déjà prises.</li>
        <li><strong>Vérification Whois en direct</strong> — chaque nom est testé sur les
          extensions (.com, .fr, .io, .co…) ; un nom affiché comme libre l'est réellement.</li>
        <li><strong>Vue matricielle par extension</strong> — un tableau compare d'un coup
          d'œil tous les noms sur toutes les extensions.</li>
      </ul>
      <p>
        Envie d'approfondir un aspect précis ? Voyez notre comparatif des
        <a routerLink="/comparatif-generateurs-de-noms">générateurs de noms de marque</a>
        pour situer les différentes approches.
      </p>

      <h2 id="faq">Questions fréquentes</h2>
      <h3>Faut-il absolument le .com ?</h3>
      <p>
        C'est un plus pour la crédibilité, mais de nombreuses marques réussissent avec un
        .io, .co, .fr ou une extension sectorielle. L'important est la cohérence et la
        disponibilité durable.
      </p>
      <h3>Combien de noms tester avant de choisir ?</h3>
      <p>
        Une liste de 15 à 30 candidats disponibles est confortable pour arbitrer. Namorama
        en génère bien plus en quelques secondes, vous gardez les meilleurs.
      </p>

      <app-article-cta></app-article-cta>
    </article>
  `,
})
export class GuideNomDeMarqueComponent {
  constructor() {
    applyContentSeo({
      title: 'Comment trouver un nom de marque disponible',
      description:
        "La méthode en 5 étapes pour trouver un nom de marque mémorable dont le domaine est libre, vérifié en temps réel par une requête Whois réelle.",
      path: '/guides/trouver-nom-de-marque',
    });
  }
}
