import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';

/**
 * Page de comparaison (intention commerciale) : Namorama vs Looka.
 * Prérendue (SSG), cible « namorama vs looka », « alternative Looka »,
 * « looka français », « générateur de nom + logo vs domaine disponible ».
 */
@Component({
  selector: 'app-comparatif-looka',
  standalone: true,
  imports: [RouterModule, ArticleCtaComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Namorama vs Looka
      </nav>

      <h1>Namorama vs Looka : nom de marque ou logo, que privilégier ?</h1>
      <p class="lead">
        Looka est avant tout un <strong>créateur de logo et de brand kit</strong> qui propose aussi des noms.
        Namorama part du problème inverse&nbsp;: trouver d'abord un <strong>nom dont le domaine est réellement
        disponible</strong>, adapté à votre marché. Voici comment choisir selon votre priorité.
      </p>

      <h2 id="en-bref">En bref</h2>
      <ul>
        <li><strong>Choisissez Looka</strong> si votre besoin immédiat est un <em>logo</em> et une identité
          visuelle complète (cartes de visite, déclinaisons réseaux sociaux…).</li>
        <li><strong>Choisissez Namorama</strong> si votre priorité est le <em>nom</em> et surtout le
          <em>domaine réellement libre</em>, avec une extension locale (<code>.fr</code>…) et des suggestions
          en français.</li>
      </ul>

      <h2 id="tableau">Tableau comparatif</h2>
      <table class="compare">
        <thead>
          <tr>
            <th>Critère</th>
            <th>Looka</th>
            <th>Namorama</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Génération de noms par IA</td>
            <td class="yes">Oui</td>
            <td class="yes">Oui</td>
          </tr>
          <tr>
            <td>Vérification de disponibilité du domaine</td>
            <td class="no">Basique</td>
            <td class="yes">Whois réel, en direct</td>
          </tr>
          <tr>
            <td>Matrice multi-extensions (.com, .fr, .io…)</td>
            <td class="no">Non</td>
            <td class="yes">Oui, disponibilité par extension</td>
          </tr>
          <tr>
            <td>Extension locale selon votre pays</td>
            <td class="no">Non</td>
            <td class="yes">Oui (ex. France → <code>.fr</code>)</td>
          </tr>
          <tr>
            <td>Suggestions régionales et culturelles</td>
            <td class="no">Non</td>
            <td class="yes">Oui</td>
          </tr>
          <tr>
            <td>Interface et contenu en français</td>
            <td class="no">Anglophone</td>
            <td class="yes">Pensé pour le marché FR</td>
          </tr>
          <tr>
            <td>Logo &amp; brand kit complet</td>
            <td class="yes">Oui (point fort, payant)</td>
            <td class="no">Pas encore</td>
          </tr>
          <tr>
            <td>Modèle</td>
            <td>Noms gratuits, logos/kit à partir de ~20&nbsp;$</td>
            <td>100 crédits offerts/mois, sans abonnement</td>
          </tr>
        </tbody>
      </table>

      <h2 id="looka-fort">Là où Looka est fort</h2>
      <p>
        Looka brille sur le <strong>design</strong>&nbsp;: son créateur de logo est réputé, et il permet de
        visualiser instantanément un nom sur une carte de visite ou une devanture, avec un brand kit complet.
        Si l'identité visuelle est votre priorité du moment, c'est un excellent outil tout-en-un.
      </p>

      <h2 id="namorama-difference">Là où Namorama fait la différence</h2>
      <p>
        <strong>Le domaine d'abord, pour de vrai.</strong> Un beau logo sur un nom dont le domaine est déjà pris
        ne sert à rien. Namorama interroge le <strong>Whois en temps réel</strong> pour chaque nom et chaque
        extension&nbsp;: vous partez d'un nom réellement réservable.
      </p>
      <p>
        <strong>Pensé pour votre marché.</strong> Selon votre localisation, Namorama propose l'<strong>extension
        locale</strong> (<code>.fr</code> en plus de <code>.com</code>) et active des <strong>suggestions
        régionales et culturelles</strong> qui sonnent juste dans votre langue.
      </p>
      <p>
        Beaucoup d'équipes utilisent d'ailleurs les deux&nbsp;: <strong>Namorama pour verrouiller le nom et le
        domaine</strong>, puis un créateur de logo pour l'identité visuelle.
      </p>

      <app-article-cta
        heading="Trouvez d'abord un nom dont le domaine est libre"
        subheading="Lancez une recherche : génération IA et vérification de disponibilité réelle, côte à côte."
      ></app-article-cta>

      <h2 id="lequel">Alors, lequel choisir ?</h2>
      <p>
        Pour un besoin centré <strong>logo / identité visuelle</strong>&nbsp;: Looka. Pour
        <strong>trouver un nom de marque dont le domaine est réellement disponible</strong>, en français et avec
        l'extension locale&nbsp;: Namorama, gratuit pour démarrer (100 crédits offerts, sans abonnement).
      </p>
      <p>
        À lire aussi&nbsp;: notre comparaison <a routerLink="/namorama-vs-namelix">Namorama vs Namelix</a>, le
        <a routerLink="/comparatif-generateurs-de-noms">comparatif général des générateurs</a> et le guide
        <a routerLink="/guides/trouver-nom-de-marque">pour trouver un nom de marque disponible</a>.
      </p>

      <app-article-cta></app-article-cta>
    </article>
  `,
})
export class ComparatifLookaComponent {
  constructor() {
    applyContentSeo({
      title: 'Namorama vs Looka : nom de marque ou logo',
      description:
        "Namorama ou Looka ? Comparatif honnête : disponibilité de domaine vérifiée au Whois et extension .fr, face à un créateur de logo anglophone.",
      path: '/namorama-vs-looka',
    });
  }
}
