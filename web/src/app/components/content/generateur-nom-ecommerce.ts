import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Landing sectorielle : générateur de nom pour boutique en ligne / e-commerce.
 * Cible « nom de boutique en ligne », « nom de marque e-commerce », « nom de shop ».
 * Cluster le plus volumineux des recherches réelles en prod.
 */
@Component({
  selector: 'app-generateur-nom-ecommerce',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Nom de boutique en ligne
      </nav>

      <h1>Générateur de nom pour boutique en ligne (e-commerce)</h1>
      <p class="lead">
        Vous lancez une <strong>boutique en ligne</strong> ou une marque e-commerce&nbsp;? Trouvez un nom
        mémorable et <strong>vérifiez la disponibilité du domaine en direct</strong> (<code>.com</code>,
        <code>.fr</code>). Décrivez vos produits, l'IA génère des dizaines de noms adaptés à la vente en ligne
        et teste chaque domaine par Whois réel.
      </p>

      <h2 id="enjeu">Un nom d'e-commerce doit tenir sur trois plans</h2>
      <ul>
        <li><strong>Le nom de domaine</strong> : c'est l'adresse de votre boutique. Sans <code>.com</code> ou
          <code>.fr</code> disponible, le nom ne sert à rien.</li>
        <li><strong>La marque</strong> : suffisamment large pour couvrir votre catalogue <em>et son évolution</em>
          (beaucoup de boutiques démarrent sur un produit puis s'étendent).</li>
        <li><strong>Le référencement</strong> : un nom distinctif se démarque mieux qu'un nom générique noyé dans
          les résultats.</li>
      </ul>

      <h2 id="descriptif-ou-invente">Descriptif ou inventé&nbsp;?</h2>
      <p>
        Un nom <strong>descriptif</strong> (ex. «&nbsp;maboutiquedefleurs&nbsp;») aide au premier coup d'œil mais
        vous enferme dans une catégorie et se démarque mal. Un nom <strong>inventé et brandable</strong> (ex.
        Petiva, Glowify, Purzio — des recherches réelles de nos utilisateurs) devient une vraie marque, s'étend à
        de nouveaux produits et se protège plus facilement. Si vous ciblez un marché local, un nom incluant une
        référence géographique ou une sonorité française peut aussi convertir.
      </p>
      <p>
        <a routerLink="/app">Namorama</a> couvre les deux styles&nbsp;: il génère des noms inventés
        <em>et</em> descriptifs, puis <strong>vérifie en temps réel</strong> quelles extensions sont libres
        (<code>.com</code>, <code>.fr</code>, <code>.net</code>…) pour que vous ne perdiez pas de temps sur des
        noms déjà pris.
      </p>

      <app-article-cta
        heading="Trouvez le nom de votre boutique en ligne"
        subheading="Décrivez vos produits, l'IA propose des noms de marque e-commerce et vérifie le domaine (.com, .fr) en direct."
      ></app-article-cta>

      <h2 id="conseils">3 réflexes avant de valider</h2>
      <ul>
        <li><strong>Sécurisez le <code>.com</code> et le <code>.fr</code></strong> ensemble quand c'est possible :
          cela protège votre marque et évite qu'un concurrent prenne l'autre extension.</li>
        <li><strong>Vérifiez la marque</strong> (INPI) et la disponibilité des pseudos réseaux sociaux.</li>
        <li><strong>Testez la prononciation à voix haute</strong> : un nom qui se dicte sans épeler se partage
          mieux.</li>
      </ul>

      <h2 id="suite">Guides liés</h2>
      <ul>
        <li><a routerLink="/generateur-nom-marque-cosmetique">Générateur de nom pour marque cosmétique / beauté</a></li>
        <li><a routerLink="/guides/trouver-nom-de-produit">Trouver un nom de produit</a></li>
        <li><a routerLink="/guides/trouver-nom-de-marque">Trouver un nom de marque disponible</a></li>
      </ul>
    </article>
  `,
})
export class GenerateurNomEcommerceComponent {
  constructor() {
    applyContentSeo({
      title: 'Générateur de nom pour boutique en ligne (e-commerce)',
      description:
        "Trouvez un nom de marque pour votre boutique en ligne, avec le domaine (.com, .fr) disponible vérifié en temps réel. Noms inventés ou descriptifs générés par l'IA de Namorama.",
      path: '/generateur-nom-ecommerce',
    });
  }
}
