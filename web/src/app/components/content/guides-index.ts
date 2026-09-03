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
        Marque, entreprise, société, produit ou startup&nbsp;: nommer, c'est choisir un nom mémorable
        <strong>dont le nom de domaine est encore libre</strong>. Nos guides pratiques vous donnent la
        méthode, et l'IA de Namorama l'accélère en générant des noms et en vérifiant la disponibilité du
        domaine en temps réel.
      </p>

      <h2 class="section-title">Générateurs de noms</h2>
      <div class="guide-list">
        <a routerLink="/generateur-nom-de-marque" class="guide-item">
          <h2>Générateur de nom de marque</h2>
          <p>Des noms générés par IA, avec le domaine vérifié libre en direct. Gratuit à l'essai.</p>
        </a>
        <a routerLink="/generateur-nom-entreprise" class="guide-item">
          <h2>Nom d'entreprise et de société</h2>
          <p>Dénomination, nom commercial, marque : trois noms différents, et où vérifier chacun.</p>
        </a>
        <a routerLink="/generateur-nom-de-domaine" class="guide-item">
          <h2>Générateur de nom de domaine</h2>
          <p>RDAP puis Whois, sur 30 extensions — et aucun domaine à vous vendre.</p>
        </a>
      </div>

      <h2 class="section-title">Générateurs de noms par secteur</h2>
      <div class="guide-list">
        <a routerLink="/generateur-nom-startup-ia" class="guide-item">
          <h2>Générateur de nom pour startup IA</h2>
          <p>Un nom premium pour votre startup d'intelligence artificielle, domaine (.ai / .com) vérifié.</p>
        </a>
        <a routerLink="/generateur-nom-ecommerce" class="guide-item">
          <h2>Nom pour boutique en ligne (e-commerce)</h2>
          <p>Un nom de marque e-commerce mémorable, avec le domaine .com / .fr disponible.</p>
        </a>
        <a routerLink="/generateur-nom-saas" class="guide-item">
          <h2>Nom pour SaaS / logiciel B2B</h2>
          <p>Un nom de produit crédible et évolutif, domaine .com / .io vérifié en direct.</p>
        </a>
        <a routerLink="/generateur-nom-marque-vetement" class="guide-item">
          <h2>Nom de marque de vêtements</h2>
          <p>Streetwear ou prêt-à-porter : un nom libre en domaine, et le réflexe classe 25.</p>
        </a>
        <a routerLink="/generateur-nom-marque-cosmetique" class="guide-item">
          <h2>Nom de marque cosmétique &amp; beauté</h2>
          <p>Un nom élégant et premium pour vos soins, cosmétiques ou bijoux.</p>
        </a>
        <a routerLink="/nom-de-startup-court-invente" class="guide-item">
          <h2>Nom court &amp; inventé (façon Qonto, Stripe)</h2>
          <p>La méthode pour un nom arbitraire, premium et disponible en .com.</p>
        </a>
      </div>

      <h2 class="section-title">Guides méthode</h2>
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
        <a routerLink="/recherche-anteriorite-marque-inpi" class="guide-item">
          <h2>Recherche d'antériorité (INPI)</h2>
          <p>L'INPI ne vérifie pas à votre place : comment chercher, et où la recherche gratuite s'arrête.</p>
        </a>
        <a routerLink="/verifier-disponibilite-nom-de-marque" class="guide-item">
          <h2>Vérifier la disponibilité d'un nom</h2>
          <p>Domaine, réseaux sociaux et marques INPI + EUIPO : le test en une saisie.</p>
        </a>
        <a routerLink="/comparatif-generateurs-de-noms" class="guide-item">
          <h2>Comparatif des générateurs de noms</h2>
          <p>Quel outil choisir, et pourquoi la vérification de disponibilité réelle change tout.</p>
        </a>
        <a routerLink="/namorama-vs-namelix" class="guide-item">
          <h2>Namorama vs Namelix</h2>
          <p>Le comparatif détaillé : disponibilité réelle, extension locale et suggestions en français.</p>
        </a>
        <a routerLink="/namorama-vs-looka" class="guide-item">
          <h2>Namorama vs Looka</h2>
          <p>Nom de marque ou logo : que privilégier, et pourquoi le domaine passe d'abord.</p>
        </a>
      </div>

      <app-article-cta></app-article-cta>
    </article>
  `,
  styles: [`
    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--p-surface-500);
      margin: 2.25rem 0 0.25rem;
    }
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
        "Tous nos guides de naming : nom de marque, d'entreprise, de produit ou de startup, avec la disponibilité du domaine vérifiée en temps réel.",
      path: '/guides',
    });
  }
}
