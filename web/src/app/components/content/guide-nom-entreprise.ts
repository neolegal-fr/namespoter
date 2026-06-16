import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Guide : trouver un nom d'entreprise (société). Page prérendue (SSG) ciblant
 * « trouver un nom d'entreprise », « nom de société », « idée de nom de boîte ».
 */
@Component({
  selector: 'app-guide-nom-entreprise',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom d'entreprise
      </nav>

      <h1>Comment trouver un nom d'entreprise (et sécuriser le domaine) ?</h1>
      <p class="lead">
        Le nom de votre entreprise vous suivra des années : sur vos factures, votre site,
        vos cartes de visite, au registre du commerce. Il doit être disponible
        <strong>juridiquement</strong> (INPI, RCS) <strong>et numériquement</strong> (nom de domaine,
        réseaux sociaux). Voici comment trouver un nom solide sans repartir de zéro trois fois.
      </p>

      <h2 id="criteres">Les 5 critères d'un bon nom d'entreprise</h2>
      <ul>
        <li><strong>Mémorable et prononçable</strong> : on doit pouvoir le dicter au téléphone sans l'épeler.</li>
        <li><strong>Disponible en domaine</strong> : idéalement le <code>.com</code> ou le <code>.fr</code>, pas seulement une extension de repli.</li>
        <li><strong>Libre au registre</strong> : vérifiez l'antériorité des marques sur la base INPI avant de vous attacher à un nom.</li>
        <li><strong>Évolutif</strong> : un nom trop descriptif (« Plomberie Dupont Marseille ») vous enferme si vous changez de métier ou de ville.</li>
        <li><strong>Sans ambiguïté à l'international</strong> : vérifiez qu'il ne signifie rien de gênant dans les langues de vos futurs marchés.</li>
      </ul>

      <h2 id="methode">Une méthode en 4 temps</h2>
      <p>
        <strong>1. Listez votre ADN.</strong> Activité, valeurs, promesse client, ton (sérieux, joueur,
        premium…). Ces mots-clés sont la matière première du nom.
      </p>
      <p>
        <strong>2. Générez large.</strong> Mots inventés, contractions, métaphores, préfixes/suffixes.
        Il faut produire beaucoup pour garder peu : c'est exactement le travail que
        <a routerLink="/app">l'IA de Namorama</a> abat en quelques secondes à partir de votre description.
      </p>
      <p>
        <strong>3. Filtrez par disponibilité.</strong> Un nom génial dont le <code>.com</code> est pris
        et coûte 5&nbsp;000&nbsp;€ n'est pas un nom disponible. Namorama teste la disponibilité réelle du
        domaine (requête Whois) pour chaque proposition, vous ne tombez jamais amoureux d'un nom mort-né.
      </p>
      <p>
        <strong>4. Vérifiez l'antériorité.</strong> Avant de déposer, contrôlez la base
        <a href="https://data.inpi.fr" target="_blank" rel="noopener">INPI</a> et faites une recherche
        de marque. C'est l'étape que personne ne doit sauter.
      </p>

      <app-article-cta
        heading="Trouvez le nom de votre entreprise"
        subheading="Décrivez votre activité, l'IA propose des noms et vérifie la disponibilité du domaine en direct."
      ></app-article-cta>

      <h2 id="erreurs">Les erreurs classiques à éviter</h2>
      <p>
        Choisir un nom impossible à orthographier, copier un concurrent à une lettre près, négliger le
        domaine jusqu'au dernier moment, ou s'attacher émotionnellement à un nom avant d'avoir vérifié
        sa disponibilité. La bonne séquence est toujours&nbsp;: <em>idées → disponibilité domaine →
        antériorité marque → décision</em>.
      </p>

      <h2 id="suite">Pour aller plus loin</h2>
      <p>
        Selon votre projet, ces guides complètent celui-ci&nbsp;:
      </p>
      <ul>
        <li><a routerLink="/guides/trouver-nom-de-marque">Trouver un nom de marque disponible</a></li>
        <li><a routerLink="/guides/trouver-nom-de-startup">Trouver un nom de startup</a></li>
        <li><a routerLink="/guides/trouver-nom-de-produit">Trouver un nom de produit</a></li>
      </ul>
    </article>
  `,
})
export class GuideNomEntrepriseComponent {
  constructor() {
    applyContentSeo({
      title: "Comment trouver un nom d'entreprise disponible",
      description:
        "Méthode pour trouver un nom d'entreprise mémorable, libre au registre (INPI/RCS) et dont le domaine est disponible. L'IA de Namorama génère et vérifie la dispo en direct.",
      path: '/guides/trouver-nom-entreprise',
    });
  }
}
