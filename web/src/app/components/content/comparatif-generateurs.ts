import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Article comparatif (intention commerciale) : Namorama face aux autres
 * approches de génération de noms. Page prérendue (SSG) ciblant « meilleur
 * générateur de nom de marque », « alternative Namelix », « générateur de nom
 * avec domaine disponible ».
 */
@Component({
  selector: 'app-comparatif-generateurs',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; Comparatif &rsaquo; Générateurs de noms
      </nav>

      <h1>Générateurs de noms de marque : comment choisir (et pourquoi la disponibilité change tout)</h1>
      <p class="lead">
        Tous les générateurs de noms ne se valent pas. La vraie ligne de partage n'est pas
        la créativité — c'est <strong>la fiabilité de la disponibilité de domaine</strong>.
        Comparons les approches pour vous éviter de tomber amoureux d'un nom inaccessible.
      </p>

      <h2 id="approches">Trois familles d'outils</h2>
      <ul>
        <li><strong>Les générateurs « combinatoires »</strong> assemblent des mots-clés et
          des suffixes. Rapides, mais souvent génériques, et la disponibilité affichée n'est
          qu'une estimation.</li>
        <li><strong>Les générateurs IA</strong> produisent des noms plus originaux à partir
          d'une description, mais ne vérifient pas toujours le domaine en temps réel.</li>
        <li><strong>Les outils intégrés génération + vérification réelle</strong> — comme
          Namorama — relient l'idée au domaine réellement réservable, en une seule passe.</li>
      </ul>

      <h2 id="criteres">Les critères qui comptent vraiment</h2>
      <table class="compare">
        <thead>
          <tr>
            <th>Critère</th>
            <th>Générateur combinatoire</th>
            <th>Générateur IA simple</th>
            <th>Namorama</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Originalité des noms</td>
            <td class="no">Faible</td>
            <td class="yes">Élevée</td>
            <td class="yes">Élevée</td>
          </tr>
          <tr>
            <td>Compréhension du projet (IA)</td>
            <td class="no">Non</td>
            <td class="yes">Oui</td>
            <td class="yes">Oui</td>
          </tr>
          <tr>
            <td>Disponibilité de domaine</td>
            <td class="no">Estimée</td>
            <td class="no">Souvent absente</td>
            <td class="yes">Whois réelle, en direct</td>
          </tr>
          <tr>
            <td>Vue multi-extensions (.com/.fr/.io…)</td>
            <td class="no">Rare</td>
            <td class="no">Rare</td>
            <td class="yes">Tableau matriciel</td>
          </tr>
          <tr>
            <td>Sans abonnement</td>
            <td>Variable</td>
            <td>Variable</td>
            <td class="yes">Oui, 100 crédits offerts</td>
          </tr>
        </tbody>
      </table>

      <h2 id="disponibilite">Pourquoi la vérification Whois réelle fait la différence</h2>
      <p>
        Beaucoup d'outils affichent un domaine comme « probablement disponible » sur la base
        d'une heuristique. Le problème : un domaine peut être déjà pris, en période de
        rédemption, ou réservé sans site visible. Namorama interroge le registre
        <strong>Whois en temps réel</strong> : un nom marqué disponible l'est réellement au
        moment de la recherche, prêt à être réservé. Vous ne perdez pas de temps sur des
        noms inaccessibles.
      </p>

      <app-article-cta
        heading="Comparez par vous-même en 30 secondes"
        subheading="Lancez une recherche : vous verrez la génération IA et la vérification de disponibilité réelle côte à côte.">
      </app-article-cta>

      <h2 id="pour-qui">Quel outil pour quel besoin ?</h2>
      <p>
        Si vous cherchez juste une inspiration jetable, un générateur combinatoire suffit.
        Mais si l'objectif est de <strong>réserver un domaine pour de vrai</strong> — pour
        une startup, une boutique, une application ou un nouveau produit — un outil qui relie
        nom et disponibilité réelle vous fera gagner des heures. C'est exactement le rôle de
        Namorama.
      </p>
      <p>
        Pour la méthode complète, lisez notre guide
        <a routerLink="/guides/trouver-nom-de-marque">comment trouver un nom de marque disponible</a>.
      </p>

      <app-article-cta></app-article-cta>
    </article>
  `,
})
export class ComparatifGenerateursComponent {
  constructor() {
    applyContentSeo({
      title: 'Comparatif des générateurs de noms de marque',
      description:
        'Comment choisir un générateur de noms de marque ? Comparatif des approches (combinatoire, IA, vérification Whois réelle) et pourquoi la disponibilité de domaine fait la différence.',
      path: '/comparatif-generateurs-de-noms',
    });
  }
}
