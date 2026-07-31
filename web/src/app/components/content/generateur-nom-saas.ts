import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Landing sectorielle : générateur de nom pour SaaS / logiciel B2B.
 * Cible « nom de logiciel SaaS », « nom application B2B », « nom de plateforme ».
 */
@Component({
  selector: 'app-generateur-nom-saas',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom de SaaS
      </nav>

      <h1>Générateur de nom pour SaaS / logiciel B2B</h1>
      <p class="lead">
        Vous créez un <strong>SaaS</strong> ou un logiciel métier&nbsp;? Trouvez un nom de produit crédible,
        facile à retenir, avec le <strong>domaine disponible vérifié en temps réel</strong>
        (<code>.com</code>, <code>.io</code>, <code>.fr</code>). Décrivez votre outil, l'IA génère des noms
        <em>brandables</em> et teste chaque domaine par Whois réel.
      </p>

      <h2 id="codes">Les codes du naming SaaS</h2>
      <ul>
        <li><strong>Prononçable et court</strong> : votre nom sera tapé, dicté en démo, cité dans un support
          client. 2 à 3 syllabes idéalement.</li>
        <li><strong>Assez large pour évoluer</strong> : un logiciel de gestion des interventions terrain peut
          s'étendre à d'autres métiers — évitez un nom qui vous enferme dans une seule fonction (un cas réel
          remonté par nos utilisateurs&nbsp;: un SaaS «&nbsp;nettoyage&nbsp;» qui ne devait pas <em>sonner</em>
          nettoyage).</li>
        <li><strong>Crédible en B2B</strong> : sérieux sans être froid. Les suffixes <code>-ify</code>,
          <code>-ops</code>, <code>-flow</code>, <code>-hub</code> fonctionnent bien.</li>
        <li><strong>Extension pro</strong> : <code>.com</code> pour la confiance, <code>.io</code> très admis dans
          le logiciel, <code>.fr</code> si votre cible est française.</li>
      </ul>

      <h2 id="methode">Le domaine d'abord, l'idée ensuite</h2>
      <p>
        La difficulté du naming SaaS n'est pas la créativité, c'est la <strong>disponibilité</strong>&nbsp;: la
        plupart des noms «&nbsp;évidents&nbsp;» sont pris. <a routerLink="/app">Namorama</a> génère des noms
        adaptés à un produit logiciel <strong>et vérifie en direct</strong> les extensions libres, pour que
        chaque suggestion soit réellement enregistrable. Vous gagnez la journée que vous auriez passée à tester
        des noms à la main.
      </p>

      <app-article-cta
        heading="Trouvez le nom de votre SaaS"
        subheading="Décrivez votre logiciel, l'IA propose des noms brandables et vérifie le domaine (.com, .io, .fr) en direct."
      ></app-article-cta>

      <h2 id="checklist">Avant de valider</h2>
      <ul>
        <li>Le <code>.com</code> (ou <code>.io</code>) est <strong>réellement libre</strong> — vérifié, pas
          supposé.</li>
        <li>Le nom ne bloque pas votre <strong>expansion produit</strong> future.</li>
        <li>La marque est disponible (INPI) et le handle réseaux sociaux aussi.</li>
      </ul>

      <h2 id="suite">Guides liés</h2>
      <ul>
        <li><a routerLink="/generateur-nom-startup-ia">Générateur de nom pour startup IA</a></li>
        <li><a routerLink="/nom-de-startup-court-invente">Nom de startup court et inventé (façon Qonto, Stripe)</a></li>
        <li><a routerLink="/guides/trouver-nom-de-produit">Trouver un nom de produit</a></li>
      </ul>
    </article>
  `,
})
export class GenerateurNomSaasComponent {
  constructor() {
    applyContentSeo({
      title: 'Générateur de nom pour SaaS / logiciel B2B',
      description:
        "Trouvez un nom pour votre SaaS ou logiciel B2B : court, crédible, avec le domaine (.com, .io, .fr) disponible vérifié en temps réel par l'IA de Namorama.",
      path: '/generateur-nom-saas',
    });
  }
}
