import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Page intention « meta-naming » : nom court, inventé, premium façon Qonto/Stripe.
 * Reprend mot pour mot la demande la plus fréquente des utilisateurs réels.
 * Cible « nom de marque court inventé », « nom de startup style Qonto »,
 * « nom premium inventé », « brandable name ».
 */
@Component({
  selector: 'app-nom-court-invente',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom court &amp; inventé
      </nav>

      <h1>Trouver un nom de marque court et inventé (façon Qonto, Stripe, Notion)</h1>
      <p class="lead">
        Vous cherchez un nom <strong>court, inventé et premium</strong> — 5 à 8 lettres, prononçable partout,
        qui sonne comme <em>Qonto, Stripe, Figma, Notion ou Brevo</em> — <strong>avec le domaine libre</strong>
        (<code>.com</code>, <code>.fr</code>)&nbsp;? C'est exactement ce que génère l'IA de Namorama, en
        vérifiant la disponibilité en temps réel.
      </p>

      <h2 id="pourquoi">Pourquoi les meilleures marques sont des mots inventés</h2>
      <p>
        Qonto, Stripe, Figma, Notion, Algolia&nbsp;: aucune ne <em>décrit</em> son produit. Un nom
        <strong>arbitraire</strong> présente trois avantages décisifs&nbsp;: il est
        <strong>disponible</strong> (les mots du dictionnaire sont pris en <code>.com</code>), il se
        <strong>protège</strong> facilement en marque, et il devient une <strong>marque forte</strong> qui
        s'étend à de nouveaux produits sans se contredire.
      </p>

      <h2 id="recette">La recette d'un bon nom inventé</h2>
      <ul>
        <li><strong>Court</strong> : 5 à 8 lettres, 2 syllabes, facile à taper.</li>
        <li><strong>Prononçable en français ET en anglais</strong> : une seule lecture évidente, sans hésitation.</li>
        <li><strong>Sonorité premium</strong> : voyelles ouvertes, consonnes nettes (le «&nbsp;o&nbsp;» de Qonto,
          le «&nbsp;i&nbsp;» de Figma).</li>
        <li><strong>Sans mot descriptif</strong> : évitez «&nbsp;tech&nbsp;», «&nbsp;smart&nbsp;», «&nbsp;AI&nbsp;»,
          «&nbsp;pro&nbsp;» — ils datent et sont saturés.</li>
        <li><strong>Le «&nbsp;test radio&nbsp;»</strong> : entendu une fois, on doit pouvoir l'écrire correctement.</li>
      </ul>

      <h2 id="obstacle">Le vrai obstacle : la disponibilité</h2>
      <p>
        Générer un joli nom inventé est facile&nbsp;; en trouver un <em>dont le <code>.com</code> est encore
        libre</em> est le vrai défi. Beaucoup de nos utilisateurs écrivent d'ailleurs leur demande comme un
        brief&nbsp;: «&nbsp;un nom court, inventé, premium, dispo en .com et .fr&nbsp;».
        <a routerLink="/app">Namorama</a> automatise exactement ça&nbsp;: il invente des dizaines de noms
        <em>brandables</em> et <strong>teste chaque domaine par Whois réel</strong>, pour ne vous montrer que
        des noms réellement enregistrables.
      </p>

      <app-article-cta
        heading="Générez votre nom court et inventé"
        subheading="Décrivez votre projet, l'IA invente des noms premium façon Qonto / Stripe et vérifie le domaine (.com, .fr) en direct."
      ></app-article-cta>

      <h2 id="suite">Guides liés</h2>
      <ul>
        <li><a routerLink="/generateur-nom-startup-ia">Générateur de nom pour startup IA</a></li>
        <li><a routerLink="/generateur-nom-saas">Générateur de nom pour SaaS / logiciel B2B</a></li>
        <li><a routerLink="/guides/trouver-nom-de-startup">Guide : trouver un nom de startup</a></li>
      </ul>
    </article>
  `,
})
export class NomCourtInventeComponent {
  constructor() {
    applyContentSeo({
      title: 'Nom de marque court et inventé, façon Qonto',
      description:
        "Trouvez un nom de marque court, inventé et premium façon Qonto ou Stripe, avec le domaine (.com, .fr) disponible vérifié en temps réel par l'IA de Namorama.",
      path: '/nom-de-startup-court-invente',
    });
  }
}
