import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Page index des guides (/guides). Hub de liens internes vers tous les guides
 * de naming — structure le maillage SEO et sert de point d'entrée éditorial.
 */
@Component({
  selector: 'app-guides-index',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; Guides
      </nav>

      <h1>Guides : trouver un nom et son domaine disponible</h1>
      <p class="lead">
        Marque, entreprise, produit ou startup&nbsp;: nommer, c'est choisir un nom mémorable
        <strong>dont le nom de domaine est encore libre</strong>. Nos guides pratiques vous donnent la
        méthode, et l'IA de Namorama l'accélère en générant des noms et en vérifiant la disponibilité du
        domaine en temps réel.
      </p>

      <div class="guide-list">
        <a routerLink="/guides/trouver-nom-de-marque" class="guide-item">
          <h2>Trouver un nom de marque disponible</h2>
          <p>La méthode en 5 étapes pour un nom mémorable dont le domaine est encore libre.</p>
        </a>
        <a routerLink="/guides/trouver-nom-entreprise" class="guide-item">
          <h2>Trouver un nom d'entreprise</h2>
          <p>Un nom solide, libre au registre (INPI/RCS) et disponible en domaine.</p>
        </a>
        <a routerLink="/guides/trouver-nom-de-produit" class="guide-item">
          <h2>Trouver un nom de produit</h2>
          <p>Descriptif, évocateur ou inventé : nommer un produit qui marque les esprits.</p>
        </a>
        <a routerLink="/guides/trouver-nom-de-startup" class="guide-item">
          <h2>Trouver un nom de startup</h2>
          <p>Court, brandable, disponible en .com / .io / .ai dès le premier jour.</p>
        </a>
        <a routerLink="/comparatif-generateurs-de-noms" class="guide-item">
          <h2>Comparatif des générateurs de noms</h2>
          <p>Quel outil choisir, et pourquoi la vérification de disponibilité réelle change tout.</p>
        </a>
        <a routerLink="/namorama-vs-namelix" class="guide-item">
          <h2>Namorama vs Namelix</h2>
          <p>Le comparatif détaillé : disponibilité réelle, extension locale et suggestions en français.</p>
        </a>
      </div>

      <app-article-cta></app-article-cta>
    </article>
  `,
  styles: [`
    .guide-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .guide-item {
      display: block;
      padding: 1.25rem 1.4rem;
      border: 1px solid var(--p-surface-200, #e5e7eb);
      border-radius: 0.8rem;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }
    .guide-item:hover {
      border-color: var(--p-primary-300, #6ee7b7);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }
    .guide-item h2 {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 0 0.4rem;
      color: var(--p-surface-900);
    }
    .guide-item p {
      margin: 0;
      color: var(--p-surface-600);
      line-height: 1.5;
    }
  `],
})
export class GuidesIndexComponent {
  constructor() {
    applyContentSeo({
      title: 'Guides pour trouver un nom et son domaine',
      description:
        "Tous nos guides de naming : nom de marque, d'entreprise, de produit ou de startup, avec la vérification de disponibilité du domaine en temps réel par l'IA de Namorama.",
      path: '/guides',
    });
  }
}
