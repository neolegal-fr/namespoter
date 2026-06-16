import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Guide : trouver un nom de startup. Page prérendue (SSG) ciblant
 * « nom de startup », « trouver un nom de startup », « naming startup ».
 */
@Component({
  selector: 'app-guide-nom-de-startup',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom de startup
      </nav>

      <h1>Comment trouver un nom de startup (court, mémorable, dispo) ?</h1>
      <p class="lead">
        Une startup nomme vite, communique vite, et lève parfois vite&nbsp;: le nom doit tenir sur un slide,
        une URL et un logo dès le premier jour. La contrainte numéro un&nbsp;: <strong>un nom de domaine
        disponible</strong>, idéalement en <code>.com</code>, <code>.io</code> ou <code>.ai</code>.
      </p>

      <h2 id="codes">Les codes du naming startup</h2>
      <ul>
        <li><strong>Court</strong> : 2 à 3 syllabes, facile à taper et à retenir.</li>
        <li><strong>Inventé ou évocateur</strong> : les mots du dictionnaire sont presque tous pris en <code>.com</code>.</li>
        <li><strong>« Brandable »</strong> : un nom qui peut devenir un verbe ou une marque forte (« to google », « to zoom »).</li>
        <li><strong>Extension crédible</strong> : <code>.com</code> reste roi, mais <code>.io</code>, <code>.ai</code> et <code>.co</code> sont parfaitement acceptés dans la tech.</li>
      </ul>

      <h2 id="techniques">Techniques qui fonctionnent</h2>
      <p>
        <strong>Contractions et fusions</strong> (Pinterest = pin + interest), <strong>suffixes courts</strong>
        (-ly, -io, -ify), <strong>voyelles retirées</strong> (Flickr, Tumblr), <strong>mots étrangers ou
        latins</strong> (Sonos, Algolia). L'enjeu n'est pas de trouver une idée, mais d'en trouver
        <em>une dont le domaine est libre</em>.
      </p>
      <p>
        C'est là que <a routerLink="/app">Namorama</a> change la donne&nbsp;: décrivez votre startup en une
        phrase, l'IA propose des dizaines de noms <em>brandables</em> et teste en direct la disponibilité du
        domaine (Whois réel). Vous ne perdez plus une journée à vérifier des noms déjà pris à la main.
      </p>

      <app-article-cta
        heading="Trouvez le nom de votre startup"
        subheading="Décrivez votre projet, l'IA génère des noms brandables et vérifie le domaine en direct."
      ></app-article-cta>

      <h2 id="extension">Faut-il absolument le .com ?</h2>
      <p>
        Le <code>.com</code> inspire confiance et reste le réflexe mondial, mais beaucoup de belles réussites
        sont parties sur <code>.io</code>, <code>.ai</code> ou <code>.co</code>. La règle pragmatique&nbsp;:
        choisissez un nom dont au moins une extension forte est libre aujourd'hui, plutôt qu'un nom parfait
        dont le <code>.com</code> est inaccessible. Vous pourrez toujours racheter l'extension premium plus tard.
      </p>

      <h2 id="suite">Guides liés</h2>
      <ul>
        <li><a routerLink="/guides/trouver-nom-de-marque">Trouver un nom de marque disponible</a></li>
        <li><a routerLink="/guides/trouver-nom-entreprise">Trouver un nom d'entreprise</a></li>
        <li><a routerLink="/guides/trouver-nom-de-produit">Trouver un nom de produit</a></li>
      </ul>
    </article>
  `,
})
export class GuideNomDeStartupComponent {
  constructor() {
    applyContentSeo({
      title: 'Comment trouver un nom de startup',
      description:
        "Court, brandable, dispo en .com / .io / .ai : la méthode pour nommer une startup et vérifier la disponibilité du domaine en direct avec l'IA de Namorama.",
      path: '/guides/trouver-nom-de-startup',
    });
  }
}
