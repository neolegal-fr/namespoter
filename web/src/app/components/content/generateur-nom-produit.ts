import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Landing transactionnelle : générateur de nom de produit.
 *
 * C'est l'intention qui amène déjà le trafic Google (« nom de produit »), sans
 * page dédiée jusqu'ici : la home visait « nom de marque » et le guide
 * /guides/trouver-nom-de-produit couvre l'intention informationnelle
 * (« comment faire »). Celle-ci vise l'intention outil (« générateur »), pour
 * éviter que les deux pages se cannibalisent.
 */
@Component({
  selector: 'app-generateur-nom-produit',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom de produit
      </nav>

      <h1>Générateur de nom de produit</h1>
      <p class="lead">
        Vous lancez un produit et il vous faut un nom&nbsp;: mémorable, prononçable, et surtout
        <strong>dont le domaine est encore libre</strong>. Décrivez votre produit en une phrase&nbsp;:
        l'IA analyse les noms déjà utilisés dans votre secteur, génère des propositions originales
        et <strong>vérifie chaque domaine en direct par une requête Whois réelle</strong>
        (<code>.com</code>, <code>.fr</code>, <code>.io</code>…).
      </p>

      <h2 id="difficulte">Pourquoi nommer un produit est plus dur qu'il n'y paraît</h2>
      <p>
        Le problème n'est presque jamais la créativité&nbsp;: c'est la disponibilité. Les noms
        «&nbsp;évidents&nbsp;» de votre marché sont pris depuis longtemps, et on s'en aperçoit
        seulement après s'y être attaché. D'où l'ordre de travail inversé que nous recommandons&nbsp;:
        <strong>vérifier avant de tomber amoureux d'un nom</strong>.
      </p>
      <p>
        Nos mesures donnent l'ampleur du phénomène. Sur des noms prononçables tirés au sort et testés
        au Whois&nbsp;: <strong>environ 83&nbsp;% des <code>.com</code> de 5&nbsp;caractères sont déjà
        déposés</strong>, contre à peu près 34&nbsp;% en 6&nbsp;caractères, et moins de 3&nbsp;% en
        7&nbsp;caractères. Viser très court, c'est donc accepter de chercher beaucoup plus longtemps —
        un arbitrage qu'il vaut mieux faire en connaissance de cause.
      </p>

      <h2 id="types">Trois familles de noms de produit</h2>
      <ul>
        <li>
          <strong>Descriptif</strong> — il dit ce que fait le produit (<em>Compta&nbsp;Facile</em>).
          Compris immédiatement, mais difficile à protéger juridiquement, banal, et presque toujours
          déjà pris en domaine.
        </li>
        <li>
          <strong>Évocateur</strong> — il suggère un bénéfice ou une image sans le décrire
          (<em>Slack</em>, <em>Stripe</em>). Le meilleur compromis dans la plupart des cas&nbsp;:
          distinctif, protégeable, et il laisse le produit évoluer.
        </li>
        <li>
          <strong>Inventé</strong> — un mot qui n'existait pas (<em>Qonto</em>, <em>Notion</em>).
          Disponibilité maximale et marque très solide, mais il faut un budget de communication pour
          lui donner du sens.
        </li>
      </ul>

      <h2 id="criteres">Les critères qui comptent vraiment</h2>
      <ul>
        <li><strong>Le test de la radio</strong>&nbsp;: entendu une fois, il doit s'écrire sans hésitation.
          Si vous devez l'épeler au téléphone, il vous coûtera cher pendant des années.</li>
        <li><strong>Deux à trois syllabes</strong>&nbsp;: assez court pour être retenu, assez long pour
          rester disponible.</li>
        <li><strong>Pas d'enfermement</strong>&nbsp;: un nom trop collé à votre première fonctionnalité
          devient un boulet quand la gamme s'élargit.</li>
        <li><strong>Vérifié sur trois plans</strong>&nbsp;: le domaine (Whois), la marque
          (<a href="https://data.inpi.fr" target="_blank" rel="noopener noreferrer">INPI</a> dans votre
          classe), et les pseudos réseaux sociaux.</li>
        <li><strong>Sans faux ami à l'international</strong> si vous visez plusieurs marchés.</li>
      </ul>

      <app-article-cta
        heading="Trouvez le nom de votre produit"
        subheading="Décrivez votre produit, l'IA propose des noms originaux et vérifie le domaine en direct — pas une estimation, une vraie requête Whois."
      ></app-article-cta>

      <h2 id="difference">Ce que fait Namorama que les autres générateurs ne font pas</h2>
      <p>
        La plupart des générateurs de noms produisent des listes séduisantes… dont une large part est
        déjà déposée. Vous découvrez le problème au moment d'acheter le domaine. Deux différences ici&nbsp;:
      </p>
      <ul>
        <li>
          <strong>La disponibilité est réelle, pas estimée.</strong> Chaque nom proposé est testé par une
          requête Whois au moment de la recherche. Un domaine affiché comme libre est réellement
          enregistrable.
        </li>
        <li>
          <strong>Votre marché est analysé avant de générer.</strong> Namorama identifie les produits
          existants de votre secteur et leurs noms&nbsp;: vous dites lesquels vous plaisent ou non, et la
          génération s'en sert pour s'en inspirer — ou s'en démarquer.
        </li>
      </ul>

      <h2 id="methode">La méthode, en trois étapes</h2>
      <ol>
        <li><strong>Décrivez votre produit</strong> en une phrase&nbsp;: ce qu'il fait, pour qui, avec quel
          ton. C'est la matière première de la génération.</li>
        <li><strong>Cadrez</strong>&nbsp;: gardez les noms du marché qui vous inspirent, écartez ceux dont
          le style vous déplaît, ajustez mots-clés, public cible et longueur minimale.</li>
        <li><strong>Choisissez</strong> parmi les noms dont le domaine est libre, comparez les extensions
          dans le tableau, et réservez celui qui vous plaît chez votre registrar.</li>
      </ol>

      <h2 id="suite">Pour aller plus loin</h2>
      <ul>
        <li><a routerLink="/guides/trouver-nom-de-produit">Guide&nbsp;: comment trouver un nom de produit qui marque les esprits</a></li>
        <li><a routerLink="/generateur-nom-saas">Générateur de nom pour SaaS / logiciel B2B</a></li>
        <li><a routerLink="/generateur-nom-ecommerce">Générateur de nom pour boutique en ligne</a></li>
        <li><a routerLink="/nom-de-startup-court-invente">Noms courts et inventés, façon Qonto ou Stripe</a></li>
        <li><a routerLink="/comparatif-generateurs-de-noms">Comparatif des générateurs de noms</a></li>
      </ul>
    </article>
  `,
})
export class GenerateurNomProduitComponent {
  constructor() {
    applyContentSeo({
      title: 'Générateur de nom de produit',
      description:
        "Trouvez un nom de produit original dont le domaine est libre : l'IA analyse votre marché, génère des idées et vérifie chaque domaine par Whois réel.",
      path: '/generateur-nom-de-produit',
    });
  }
}
