import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Landing sectorielle : générateur de nom pour marque cosmétique / beauté / bijoux.
 * Cible « nom de marque cosmétique », « nom marque beauté », « nom marque bijoux ».
 * Niche en croissance dans les recherches réelles récentes.
 */
@Component({
  selector: 'app-generateur-nom-marque-cosmetique',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom de marque cosmétique
      </nav>

      <h1>Générateur de nom pour marque cosmétique &amp; beauté</h1>
      <p class="lead">
        Cosmétiques, soins, bien-être ou bijoux&nbsp;: trouvez un <strong>nom de marque élégant et premium</strong>,
        avec le <strong>domaine disponible vérifié en temps réel</strong> (<code>.com</code>, <code>.fr</code>).
        Décrivez votre univers, l'IA propose des noms raffinés et teste chaque domaine par Whois réel.
      </p>

      <h2 id="codes">Ce qui fait un bon nom de marque beauté</h2>
      <ul>
        <li><strong>Élégant et évocateur</strong> : la beauté vend une émotion. Des sonorités douces, une
          référence à l'éclat, à la nature ou à la sérénité fonctionnent bien (Glowify, Harmonia, AuraZen — des
          recherches réelles de nos utilisatrices).</li>
        <li><strong>Court et inventé</strong> : 5 à 8 lettres, facile à prononcer en français et en anglais, sans
          décrire explicitement le produit — pour pouvoir s'étendre du soin au maquillage, aux bijoux, etc.</li>
        <li><strong>Premium sans être «&nbsp;cheap&nbsp;»</strong> : un nom qui respire le haut de gamme se
          valorise mieux en rayon comme en ligne.</li>
        <li><strong>Féminin ou universel</strong> selon votre cible, avec une identité qui vieillit bien.</li>
      </ul>

      <h2 id="extension">Le domaine, socle de votre marque</h2>
      <p>
        Un beau nom sans domaine libre n'est pas une marque. En beauté, le <code>.com</code> (portée
        internationale) et le <code>.fr</code> (confiance locale) sont les deux extensions à sécuriser en
        priorité. <a routerLink="/app">Namorama</a> génère des noms adaptés à l'univers cosmétique
        <strong>et vérifie en direct</strong> quelles extensions sont réellement disponibles — vous ne tombez
        plus amoureux d'un nom déjà pris.
      </p>

      <app-article-cta
        heading="Trouvez le nom de votre marque beauté"
        subheading="Décrivez votre gamme, l'IA propose des noms élégants et vérifie le domaine (.com, .fr) en direct."
      ></app-article-cta>

      <h2 id="conseils">Avant de lancer votre marque</h2>
      <ul>
        <li>Vérifiez que le nom est <strong>libre à l'INPI</strong> (classe cosmétiques / bijoux) — la beauté est
          un secteur très concurrentiel.</li>
        <li>Réservez le <strong>handle Instagram / TikTok</strong> en même temps que le domaine.</li>
        <li>Assurez-vous que le nom <strong>ne se limite pas</strong> à votre premier produit si vous comptez
          élargir la gamme.</li>
      </ul>

      <h2 id="suite">Guides liés</h2>
      <ul>
        <li><a routerLink="/generateur-nom-ecommerce">Générateur de nom pour boutique en ligne</a></li>
        <li><a routerLink="/nom-de-startup-court-invente">Nom court et inventé (façon Qonto, Stripe)</a></li>
        <li><a routerLink="/guides/trouver-nom-de-marque">Trouver un nom de marque disponible</a></li>
      </ul>
    </article>
  `,
})
export class GenerateurNomMarqueCosmetiqueComponent {
  constructor() {
    applyContentSeo({
      title: 'Générateur de nom pour marque cosmétique & beauté',
      description:
        "Trouvez un nom de marque élégant pour vos cosmétiques, soins ou bijoux, avec le domaine (.com, .fr) disponible vérifié en temps réel par l'IA de Namorama.",
      path: '/generateur-nom-marque-cosmetique',
    });
  }
}
