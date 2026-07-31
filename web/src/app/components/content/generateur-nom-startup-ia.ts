import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Landing sectorielle : générateur de nom pour startup IA. Cible « nom de
 * startup IA », « nom entreprise intelligence artificielle », « nom marque IA ».
 * Cluster n°1 des recherches réelles en prod.
 */
@Component({
  selector: 'app-generateur-nom-startup-ia',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom de startup IA
      </nav>

      <h1>Générateur de nom pour startup IA</h1>
      <p class="lead">
        Trouvez un <strong>nom de marque pour votre startup d'intelligence artificielle</strong> — court,
        premium et facile à prononcer — avec le <strong>domaine disponible vérifié en temps réel</strong>
        (<code>.ai</code>, <code>.com</code>, <code>.io</code>). Décrivez votre projet, l'IA propose des
        dizaines de noms <em>brandables</em> et teste chaque domaine par Whois réel.
      </p>

      <h2 id="codes">À quoi ressemble un bon nom de startup IA&nbsp;?</h2>
      <ul>
        <li><strong>Court et inventé</strong> : 5 à 8 lettres, sans mot descriptif. Les meilleures marques tech
          (Qonto, Stripe, Notion, Mistral) ne <em>décrivent</em> pas le produit — elles sonnent bien.</li>
        <li><strong>Sans «&nbsp;AI&nbsp;» collé partout</strong> : «&nbsp;SmartAI&nbsp;», «&nbsp;DataAI&nbsp;»
          sont génériques et déjà pris. Un nom arbitraire vieillit mieux et se protège plus facilement.</li>
        <li><strong>Prononçable en français et en anglais</strong> : votre startup vise souvent l'international
          dès le départ.</li>
        <li><strong>Extension crédible</strong> : <code>.ai</code> est devenu un signal fort dans l'écosystème IA,
          mais un <code>.com</code> ou <code>.io</code> libre reste un atout de confiance.</li>
      </ul>

      <h2 id="methode">La contrainte n°1 : un domaine réellement libre</h2>
      <p>
        Le vrai problème n'est pas de <em>trouver une idée</em> de nom, mais d'en trouver une
        <em>dont le domaine est encore disponible</em>. Les générateurs classiques proposent de jolis noms…
        déjà enregistrés. <a routerLink="/app">Namorama</a> inverse la logique&nbsp;: il génère des noms
        inventés adaptés à l'IA <strong>puis vérifie la disponibilité en direct</strong> sur <code>.ai</code>,
        <code>.com</code>, <code>.io</code> et l'extension de votre choix. Vous ne repartez qu'avec des noms
        réellement enregistrables aujourd'hui.
      </p>

      <app-article-cta
        heading="Nommez votre startup IA"
        subheading="Décrivez votre produit IA, l'IA génère des noms premium et vérifie le domaine (.ai, .com, .io) en direct."
      ></app-article-cta>

      <h2 id="extension">.ai, .com ou .io pour une startup IA&nbsp;?</h2>
      <p>
        Le <code>.ai</code> affiche immédiatement votre positionnement et de nombreuses startups IA l'adoptent.
        Le <code>.com</code> reste le réflexe de confiance mondial&nbsp;; le <code>.io</code> est un classique de
        la tech. La règle pragmatique&nbsp;: choisissez un nom dont <strong>au moins une extension forte est
        libre maintenant</strong>, plutôt qu'un nom parfait dont le <code>.com</code> est inaccessible.
      </p>

      <h2 id="suite">Guides liés</h2>
      <ul>
        <li><a routerLink="/nom-de-startup-court-invente">Nom de startup court et inventé (façon Qonto, Stripe)</a></li>
        <li><a routerLink="/generateur-nom-saas">Générateur de nom pour SaaS / logiciel B2B</a></li>
        <li><a routerLink="/guides/trouver-nom-de-startup">Guide : trouver un nom de startup</a></li>
      </ul>
    </article>
  `,
})
export class GenerateurNomStartupIaComponent {
  constructor() {
    applyContentSeo({
      title: 'Générateur de nom pour startup IA',
      description:
        "Trouvez un nom de marque pour votre startup IA : court, premium, avec le domaine (.ai, .com, .io) disponible vérifié en temps réel par l'IA de Namorama.",
      path: '/generateur-nom-startup-ia',
    });
  }
}
