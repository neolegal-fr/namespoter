import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Guide : trouver un nom de produit. Page prérendue (SSG) ciblant
 * « trouver un nom de produit », « nommer un produit », « naming produit ».
 */
@Component({
  selector: 'app-guide-nom-de-produit',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom de produit
      </nav>

      <h1>Comment trouver un nom de produit qui marque les esprits ?</h1>
      <p class="lead">
        Un bon nom de produit se retient, se cherche sur Google et se prononce sans hésiter. Contrairement
        au nom d'entreprise, il peut être plus descriptif, plus joueur, plus ciblé sur un bénéfice. Mais il
        a le même impératif&nbsp;: <strong>un nom de domaine ou un sous-domaine disponible</strong> pour
        sa page produit.
      </p>

      <h2 id="types">Les grands types de noms de produit</h2>
      <ul>
        <li><strong>Descriptif</strong> : dit ce que fait le produit (« Mailchimp », « PayPal »). Facile à comprendre, plus dur à protéger.</li>
        <li><strong>Évocateur</strong> : suggère une sensation ou un bénéfice (« Slack », « Notion »). Mémorable et flexible.</li>
        <li><strong>Inventé</strong> : un mot nouveau (« Spotify », « Algolia »). Disponible partout, mais demande de l'éducation client.</li>
        <li><strong>Composé</strong> : deux mots fusionnés (« Facebook », « Snapchat »). Bon compromis sens / disponibilité.</li>
      </ul>

      <h2 id="methode">La méthode pour nommer un produit</h2>
      <p>
        <strong>1. Définissez la promesse.</strong> Quel problème résout le produit, pour qui, et avec quelle
        émotion&nbsp;? Un nom de produit raconte un bénéfice, pas une fiche technique.
      </p>
      <p>
        <strong>2. Explorez plusieurs registres.</strong> Générez des dizaines de pistes descriptives,
        évocatrices et inventées avant de juger. <a routerLink="/app">Le générateur de Namorama</a> produit
        ces variations à partir d'une simple description, et teste la disponibilité du domaine pour chacune.
      </p>
      <p>
        <strong>3. Testez la prononciation.</strong> Dites le nom à voix haute, faites-le répéter. S'il faut
        l'épeler, il freinera le bouche-à-oreille.
      </p>
      <p>
        <strong>4. Sécurisez le domaine.</strong> Même pour un produit lancé sous une marque existante, une
        URL dédiée (<code>produit.com</code> ou <code>marque.com/produit</code>) renforce le référencement et
        les campagnes. Vérifiez la disponibilité avant l'annonce, pas après.
      </p>

      <app-article-cta
        heading="Trouvez le nom de votre produit"
        subheading="Décrivez votre produit, l'IA génère des noms et vérifie la disponibilité du domaine en direct."
      ></app-article-cta>

      <h2 id="domaine">Faut-il un domaine dédié pour un produit ?</h2>
      <p>
        Pas toujours, mais c'est souvent un atout&nbsp;: un domaine exact améliore la mémorisation, facilite
        les publicités et protège le nom. À défaut du <code>.com</code>, un <code>.io</code>, <code>.app</code>
        ou le <code>.fr</code> local font très bien l'affaire. L'essentiel est de vérifier qu'au moins une
        extension crédible est libre avant de figer le nom.
      </p>

      <h2 id="suite">Guides liés</h2>
      <ul>
        <li><a routerLink="/guides/trouver-nom-de-marque">Trouver un nom de marque disponible</a></li>
        <li><a routerLink="/guides/trouver-nom-entreprise">Trouver un nom d'entreprise</a></li>
        <li><a routerLink="/guides/trouver-nom-de-startup">Trouver un nom de startup</a></li>
      </ul>
    </article>
  `,
})
export class GuideNomDeProduitComponent {
  constructor() {
    applyContentSeo({
      title: 'Comment trouver un nom de produit',
      description:
        "Descriptif, évocateur ou inventé : la méthode pour nommer un produit mémorable et vérifier la disponibilité de son domaine en direct.",
      path: '/guides/trouver-nom-de-produit',
    });
  }
}
