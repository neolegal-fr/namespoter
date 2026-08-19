import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Accueil — étape 2 de la refonte.
 *
 * Prérendue en HTML statique (SSG). Le contenu reste écrit en dur en français
 * plutôt que via ngx-translate : au prerender, `CustomTranslateLoader` renvoie
 * un dictionnaire vide côté serveur, donc tout texte passé par le pipe
 * `translate` sortirait en clé brute dans le HTML indexé.
 *
 * Aucune API navigateur : le composant doit rester rendu côté serveur.
 *
 * Ce qui est CONSERVÉ de la version précédente, volontairement : la FAQ, le
 * paragraphe « pour quels projets », les liens sectoriels et les liens de
 * guides. La maquette ne les montre pas, mais ce sont les seuls contenus
 * indexables du site — et la FAQ est adossée au bloc JSON-LD `FAQPage` de
 * `index.html`, qui exige que les questions soient visibles sur la page. Les
 * retirer aurait cassé le balisage en plus de vider la page de son texte.
 *
 * `p-button` n'est pas utilisé ici : les CTA de la maquette ont leurs propres
 * aplats, rayons et survols, et PrimeNG impose les siens sur ses composants.
 * Des `<a>` stylés donnent le rendu exact et restent des liens réels — donc
 * suivis par Google et ouvrables dans un nouvel onglet.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule],
  template: `
    <article class="nm-landing">

      <!-- ═══ Héros — aplat sombre, pleine largeur ═══════════════════════ -->
      <section class="nm-hero">
        <div class="nm-hero__inner">

          <div class="nm-hero__col">
            <p class="nm-pill">
              <span class="nm-pill__dot" aria-hidden="true"></span>
              Registres, INPI et réseaux interrogés en direct
            </p>

            <!--
              Les trois variantes sont dans le HTML prérendu (aucune injectée en
              JS) : Google et les lecteurs d'écran lisent la phrase complète
              « nom de produit / marque / société », le CSS n'en montre qu'une à
              la fois. Les séparateurs restent dans le texte, masqués à l'œil.
            -->
            <h1 class="nm-h1">
              Trouvez un nom de <span class="word-rotator"><span class="word-rotator__item word-rotator__item--1">produit</span><span class="sr-only"> / </span><span class="word-rotator__item word-rotator__item--2">marque</span><span class="sr-only"> / </span><span class="word-rotator__item word-rotator__item--3">société</span></span><span class="sr-only">&nbsp;</span> vraiment libre
            </h1>

            <p class="nm-lead">
              Domaine, réseaux sociaux, et aucune marque déposée. Les générateurs de
              noms s'arrêtent au .com — Namorama vérifie aussi l'INPI et l'EUIPO,
              pour que vous choisissiez un nom que vous pourrez vraiment garder.
            </p>

            <div class="nm-cta-row">
              <a routerLink="/app" class="nm-btn nm-btn--accent">Trouver mon nom</a>
              <a routerLink="/verifier-disponibilite-nom-de-marque" class="nm-btn nm-btn--ghost">Voir un rapport de marque</a>
            </div>

            <ul class="nm-mentions">
              <li>100 crédits offerts chaque mois</li>
              <li>≈ 50 noms libres + 1 rapport approfondi</li>
              <li>Sans abonnement</li>
            </ul>
          </div>

          <!--
            Démonstration FIGÉE, pas un formulaire : décision explicite du
            handoff. Les segments changent le volet affiché, rien de plus —
            aucune saisie, aucun appel réseau. Les boutons portent donc
            « type="button" » et un « aria-controls » vers le panneau.
          -->
          <div class="nm-hero__col">
            <div class="nm-browser" role="group" aria-label="Aperçu de l'application">
              <div class="nm-browser__bar" aria-hidden="true">
                <span class="nm-browser__dot"></span>
                <span class="nm-browser__dot"></span>
                <span class="nm-browser__dot"></span>
                <span class="nm-browser__url">namorama.com/app</span>
              </div>

              <div class="nm-panel">
                <div class="nm-steps">
                  @for (s of steps; track s.n) {
                    <button type="button"
                            class="nm-step"
                            [class.nm-step--on]="step() === s.n"
                            [attr.aria-pressed]="step() === s.n"
                            aria-controls="nm-demo-panel"
                            (click)="step.set(s.n)">
                      <span class="nm-step__num">{{ s.n }}</span>
                      <span class="nm-step__label">{{ s.label }}</span>
                    </button>
                  }
                </div>

                <p class="nm-overline">{{ current().overline }}</p>

                <!-- Hauteur plancher : sans elle, la page saute à chaque
                     changement d'étape, les volets n'ayant pas la même taille. -->
                <div id="nm-demo-panel" class="nm-panel__body">

                  @switch (step()) {
                    @case (1) {
                      <p class="nm-quote">« Des vélos reconditionnés, vendus en ligne, livrés montés. »</p>
                      <p class="nm-note">L'IA reformule votre projet, puis en extrait les mots qui portent le nom.</p>
                      <div class="nm-chips">
                        <span class="nm-chip">vélo</span>
                        <span class="nm-chip">reconditionné</span>
                        <span class="nm-chip">roue</span>
                        <span class="nm-chip nm-chip--accent">+ ajouter</span>
                      </div>
                    }
                    @case (2) {
                      <div class="nm-chips">
                        <span class="nm-chip nm-chip--accent">court</span>
                        <span class="nm-chip nm-chip--accent">inventé</span>
                        <span class="nm-chip">prononçable en français</span>
                        <span class="nm-chip">5 à 8 lettres</span>
                        <span class="nm-chip">évite « bike »</span>
                      </div>
                      <p class="nm-note">Déjà pris dans votre secteur — l'IA les évite : Upway, Loewi, Cyclofix.</p>
                      <p class="nm-note">Classes INPI surveillées : 12 · 35 · 37</p>
                    }
                    @case (3) {
                      <ul class="nm-verdicts">
                        @for (d of demoDomains; track d.name) {
                          <li class="nm-verdict">
                            <span class="nm-verdict__name">{{ d.name }}</span>
                            <span class="nm-verdict__state" [class]="'nm-verdict__state--' + d.state">{{ d.label }}</span>
                            <span class="nm-verdict__cost">{{ d.cost }}</span>
                          </li>
                        }
                      </ul>
                      <p class="nm-note">Seuls les domaines libres consomment un crédit. Les autres sont offerts.</p>
                    }
                    @case (4) {
                      <div class="nm-report-teaser">
                        <p class="nm-report-teaser__name">roulio</p>
                        <p class="nm-report-teaser__price">50 crédits</p>
                        <ul class="nm-report-teaser__list">
                          <li>Marques françaises — INPI</li>
                          <li>Marques européennes — EUIPO</li>
                          <li>Pseudos sur 4 réseaux</li>
                          <li>X · &#64;roulio</li>
                        </ul>
                        <p class="nm-note">Facturé une seule fois par nom. Le rapport reste dans votre projet, exportable en PDF.</p>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ═══ Sections claires ═══════════════════════════════════════════ -->
      <div class="nm-light">

        <!-- Les 4 contrôles -->
        <section class="nm-section">
          <h2 class="nm-h2">Le .com est libre. La marque, elle, est déposée depuis 2019.</h2>
          <p class="nm-section__lead">
            C'est la mauvaise surprise que Namorama vous évite. Chaque nom passe
            quatre contrôles, pas un.
          </p>
          <div class="nm-grid-4">
            @for (c of controls; track c.overline) {
              <div class="nm-card">
                <p class="nm-card__overline">{{ c.overline }}</p>
                <h3 class="nm-card__title">{{ c.title }}</h3>
                <p class="nm-card__text">{{ c.text }}</p>
              </div>
            }
          </div>
        </section>

        <!-- Comparatif -->
        <section class="nm-section">
          <div class="nm-table-scroll" tabindex="0" role="region" aria-label="Comparatif des générateurs de noms">
          <div class="nm-table" role="table">
            <div class="nm-table__row nm-table__row--head" role="row">
              <span role="columnheader">Ce que vous obtenez</span>
              <span role="columnheader" class="nm-table__us">Namorama</span>
              <span role="columnheader">Générateurs IA</span>
              <span role="columnheader">Registrars</span>
            </div>
            @for (r of compare; track r.critere) {
              <div class="nm-table__row" role="row">
                <span role="cell">{{ r.critere }}</span>
                <span role="cell" class="nm-table__us">{{ r.nous }}</span>
                <span role="cell">{{ r.ia }}</span>
                <span role="cell">{{ r.reg }}</span>
              </div>
            }
          </div>
          </div>
        </section>

        <!-- Pour qui — texte SEO conservé -->
        <section class="nm-section nm-section--narrow">
          <h2 class="nm-h2 nm-h2--alt">Pour quels projets ?</h2>
          <p class="nm-prose">
            Que vous lanciez une <strong>startup</strong>, une <strong>boutique e-commerce</strong>,
            un <strong>restaurant</strong>, une <strong>application mobile</strong>, un cabinet de
            <strong>conseil</strong> ou une marque de <strong>cosmétiques</strong>, Namorama vous aide
            à trouver un nom mémorable dont le nom de domaine est encore libre. Idéal pour
            choisir un nom de startup, nommer un nouveau produit ou rebrander une activité existante.
          </p>
        </section>

        <!-- FAQ — adossée au JSON-LD FAQPage d'index.html : les questions
             doivent rester visibles sur la page, sinon le balisage devient
             non conforme. -->
        <section class="nm-section nm-section--narrow">
          <h2 class="nm-h2 nm-h2--alt">Questions fréquentes</h2>
          <div class="nm-faq">
            @for (f of faq; track f.q) {
              <div class="nm-faq__item">
                <h3 class="nm-faq__q">{{ f.q }}</h3>
                <p class="nm-faq__a">{{ f.a }}</p>
              </div>
            }
          </div>
        </section>

        <!-- Guides et générateurs sectoriels — maillage interne conservé.
             Hauteur minimale de 44px : ce sont des cibles tactiles. -->
        <section class="nm-section">
          <h2 class="nm-h2 nm-h2--alt">Guides de naming par secteur</h2>
          <p class="nm-section__lead">
            Les pages que Google indexe, et par lesquelles vos futurs clients arrivent.
          </p>
          <div class="nm-links">
            @for (l of guides; track l.path) {
              <a [routerLink]="l.path" class="nm-link-pill">{{ l.label }}</a>
            }
          </div>
        </section>

        <!-- CTA final -->
        <section class="nm-section">
          <div class="nm-final">
            <div>
              <h2 class="nm-final__title">Votre nom est encore libre</h2>
              <p class="nm-final__text">
                100 crédits offerts chaque mois : environ 50 noms libres, et un rapport approfondi.
              </p>
            </div>
            <a routerLink="/app" class="nm-btn nm-btn--accent">Lancer une recherche gratuite</a>
          </div>
        </section>

      </div>
    </article>
  `,
  styleUrl: './landing.css',
})
export class LandingComponent {
  /** Volet affiché dans la démonstration figée du héros. */
  readonly step = signal(3);

  readonly steps = [
    { n: 1, label: 'Décrire' },
    { n: 2, label: 'Cadrer' },
    { n: 3, label: 'Domaines' },
    { n: 4, label: 'Rapport' },
  ];

  private readonly overlines: Record<number, string> = {
    1: 'Étape 1 — votre projet en une phrase',
    2: 'Étape 2 — cadrer le style et les contraintes',
    3: 'Étape 3 — domaines libres · 1 crédit chacun',
    4: 'Étape 4 — rapport approfondi · 50 crédits',
  };

  current() {
    return { overline: this.overlines[this.step()] };
  }

  /**
   * Trois états, jamais deux. « non vérifiable » a sa propre couleur parce
   * qu'il ne doit se confondre ni avec « libre » ni avec « pris » — et il
   * n'est jamais facturé, au même titre que « pris ».
   */
  readonly demoDomains = [
    { name: 'roulio.com',  state: 'free',    label: 'libre',          cost: '1 crédit' },
    { name: 'bikara.com',  state: 'free',    label: 'libre',          cost: '1 crédit' },
    { name: 'sprocco.com', state: 'free',    label: 'libre',          cost: '1 crédit' },
    { name: 'cyclique.fr', state: 'free',    label: 'libre',          cost: '1 crédit' },
    { name: 'pedalo.com',  state: 'taken',   label: 'pris',           cost: 'non facturé' },
    { name: 'moyeu.ch',    state: 'unknown', label: 'non vérifiable', cost: 'non facturé' },
  ];

  readonly controls = [
    {
      overline: '01 — DOMAINE',
      title: 'Trois états, pas deux',
      text: "Libre, pris, ou invérifiable. Un registre en panne ne se déguise jamais en bonne nouvelle.",
    },
    {
      overline: '02 — INPI',
      title: 'Marques françaises et UE',
      text: "Recherche d'antériorité à l'INPI et à l'EUIPO, sur les classes de Nice qui vous concernent. La marque UE couvre les 27 États membres.",
    },
    {
      overline: '03 — RÉSEAUX',
      title: 'Le pseudo suit le nom',
      text: 'Instagram, LinkedIn, X, TikTok : un nom dont le handle est pris coûte cher en notoriété.',
    },
    {
      overline: '04 — EUROPE',
      title: 'Pensé pour le .fr',
      text: 'Noms prononçables en français, extensions européennes en premier, données hébergées en UE.',
    },
  ];

  readonly compare = [
    { critere: 'Noms générés par IA',              nous: 'oui',               ia: 'oui',      reg: '—' },
    { critere: 'Disponibilité du domaine',         nous: 'registre en direct', ia: 'estimée',  reg: 'oui' },
    { critere: 'Antériorité de marque INPI / EUIPO', nous: 'incluse',          ia: '—',        reg: '—' },
    { critere: 'Pseudos réseaux sociaux',          nous: 'inclus',            ia: '—',        reg: '—' },
    { critere: 'État « invérifiable » signalé',    nous: 'oui',               ia: '—',        reg: '—' },
    { critere: 'Sans abonnement',                  nous: 'oui',               ia: 'rarement', reg: 'oui' },
  ];

  readonly faq = [
    {
      q: 'Comment trouver un nom de domaine disponible ?',
      a: "Décrivez votre projet sur Namorama : l'IA propose des noms de produit, de marque ou de société, et teste automatiquement leur disponibilité en domaine via une requête aux registres. Les noms libres sont affichés instantanément, prêts à être réservés chez votre registrar.",
    },
    {
      q: 'Le service est-il gratuit ?',
      a: 'Oui pour démarrer : vous disposez de 100 crédits gratuits chaque mois, sans abonnement. Une suggestion de domaine coûte 1 crédit. Des packs sans engagement sont disponibles ensuite.',
    },
    {
      q: 'La disponibilité affichée est-elle fiable ?',
      a: "Oui. Contrairement aux générateurs qui se contentent d'estimer, Namorama interroge le registre en temps réel (RDAP, avec WHOIS en repli). Un domaine indiqué comme disponible l'est réellement au moment de la recherche, et un registre injoignable est signalé comme tel plutôt que deviné.",
    },
    {
      q: 'Quelles extensions de domaine sont vérifiées ?',
      a: 'Les extensions les plus courantes comme .com, .fr, .io, .co ou .net, ainsi que d\'autres que vous pouvez ajouter selon votre projet. Le résultat s\'affiche sous forme de tableau comparatif.',
    },
  ];

  readonly guides = [
    { path: '/generateur-nom-saas',                    label: 'Nom de startup SaaS' },
    { path: '/generateur-nom-marque-cosmetique',       label: 'Nom de marque cosmétique' },
    { path: '/generateur-nom-ecommerce',               label: 'Nom de boutique en ligne' },
    { path: '/nom-de-startup-court-invente',           label: 'Nom court inventé' },
    { path: '/generateur-nom-startup-ia',              label: 'Nom de startup IA' },
    { path: '/generateur-nom-de-produit',              label: 'Nom de produit' },
    { path: '/guides/trouver-nom-de-marque',           label: 'Trouver un nom de marque' },
    { path: '/guides/trouver-nom-entreprise',          label: "Trouver un nom d'entreprise" },
    { path: '/guides/trouver-nom-de-startup',          label: 'Trouver un nom de startup' },
    { path: '/verifier-disponibilite-nom-de-marque',   label: 'Vérifier une marque avant de déposer' },
    { path: '/comparatif-generateurs-de-noms',         label: 'Comparatif des générateurs' },
    { path: '/guides',                                 label: 'Tous les guides' },
  ];
}
