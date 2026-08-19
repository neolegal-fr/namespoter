import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { SafeHtml } from '@angular/platform-browser';

/** Une extension et son verdict, tels qu'affichés sur une carte. */
interface ExtVerdict {
  ext: string;
  domain: string;
  /** true = libre · false = pris · null = non vérifiable · undefined = en cours */
  state: boolean | null | undefined;
  key: 'free' | 'taken' | 'unknown' | 'pending';
}

/**
 * Grille de cartes de résultats — étape 3 de la refonte.
 *
 * Remplace la matrice `p-table` (noms × extensions) par des cartes, comme le
 * demande la maquette. Composant PRÉSENTATIONNEL et séparé, volontairement :
 * le wizard fait 1760 lignes de logique (crédits, favoris, projets,
 * paiements) et réécrire son gabarit en place aurait mêlé un changement
 * d'apparence à du code critique. Ici, il ne passe que des données et reçoit
 * des événements — sa logique reste intacte.
 *
 * Ce que la maquette ne montre pas mais qui est CONSERVÉ, parce que ce sont
 * des fonctions réelles du produit : les notes pouce haut/bas (qui nourrissent
 * la génération suivante), les badges de style, et l'analyse en étoiles
 * dépliable.
 *
 * Ce que la maquette montre et qui n'est PAS repris : le bouton « Réserver »
 * vers le registrar. Il avait été retiré du produit au profit du rapport de
 * marque (US-054) ; le réintroduire serait une décision produit, pas un
 * habillage.
 */
@Component({
  selector: 'app-results-grid',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <!-- Bandeau de crédits — pièce maîtresse du modèle économique : le débit
         doit être incontestable, donc énoncé avant les résultats. -->
    <div class="rg-credits">
      <span>
        <strong>{{ debited() }}</strong>
        {{ (debited() > 1 ? 'WIZARD.STEP3.GRID_DEBITED_MANY' : 'WIZARD.STEP3.GRID_DEBITED_ONE') | translate }}
      </span>
      <span class="rg-credits__sep" aria-hidden="true"></span>
      <span>{{ 'WIZARD.STEP3.GRID_NEVER_BILLED' | translate }}</span>
      <span class="rg-credits__sep" aria-hidden="true"></span>
      <span>{{ 'WIZARD.STEP3.GRID_REPORT_PRICE' | translate:{ n: reportCost() } }}</span>
    </div>

    <!-- Filtres. Aucun ne porte sur une donnée payante (INPI, réseaux) :
         elle n'existe pas sur les noms dont le rapport n'est pas acheté. -->
    <div class="rg-filters" role="group" aria-label="Filtrer les résultats">
      @for (f of filters; track f.key) {
        <button type="button"
                class="rg-filter"
                [class.rg-filter--on]="filter() === f.key"
                [attr.aria-pressed]="filter() === f.key"
                (click)="filter.set(f.key)">{{ f.label | translate }}</button>
      }
    </div>

    @if (visible().length === 0) {
      <p class="rg-empty">{{ 'WIZARD.STEP3.GRID_EMPTY' | translate }}</p>
    }

    <div class="rg-grid">
      @for (d of visible(); track d.id) {
        <article class="rg-card" [class.rg-card--strong]="freeCount(d) === extensions().length && extensions().length > 0">

          <header class="rg-card__head">
            <div class="rg-card__id">
              <h3 class="rg-card__name">{{ d.name }}</h3>
              @if (isLocal() && d.style && d.style !== 'standard') {
                <span class="rg-tag">
                  {{ (d.style === 'descriptive' ? 'WIZARD.STYLE.DESCRIPTIVE' : 'WIZARD.STYLE.CULTURAL') | translate }}
                </span>
              }
              @if (d.isManual) {
                <i class="pi pi-pencil rg-card__manual"
                   [attr.aria-label]="'WIZARD.STEP3.MANUAL_TOOLTIP' | translate"></i>
              }
            </div>
            <!-- Le badge porte le COÛT du nom : 1 crédit par domaine libre. -->
            <span class="rg-cost" [class.rg-cost--accent]="freeCount(d) > 0">
              {{ (freeCount(d) > 1 ? 'WIZARD.STEP3.GRID_CREDIT_MANY' : 'WIZARD.STEP3.GRID_CREDIT_ONE') | translate:{ n: freeCount(d) } }}
            </span>
          </header>

          <!-- Uniquement les verdicts de DOMAINE. Jamais INPI ni réseaux :
               ces données ne sont pas payées sur cet écran. -->
          <ul class="rg-verdicts">
            @for (v of verdicts(d); track v.ext) {
              <li class="rg-verdict">
                <span class="rg-verdict__label">{{ v.domain }}</span>
                @switch (v.key) {
                  @case ('pending') {
                    <span class="rg-verdict__value rg-verdict__value--pending">
                      <i class="pi pi-spin pi-spinner"></i> {{ 'WIZARD.STEP3.GRID_CHECKING' | translate }}
                    </span>
                  }
                  @default {
                    <span class="rg-verdict__value" [class]="'nm-verdict__state--' + v.key">{{ stateLabel(v.key) | translate }}</span>
                  }
                }
              </li>
            }
          </ul>

          <div class="rg-sep" aria-hidden="true"></div>

          <!-- Palier payant -->
          @if (hasReport(d.name)) {
            <p class="rg-paid rg-paid--done">
              <i class="pi pi-check-circle"></i> {{ 'WIZARD.STEP3.GRID_REPORT_OWNED' | translate }}
            </p>
          } @else {
            <p class="rg-paid">
              <i class="pi pi-lock"></i> {{ 'WIZARD.STEP3.GRID_LOCKED' | translate:{ n: reportCost() } }}
            </p>
          }

          <div class="rg-actions">
            <button type="button" class="rg-btn rg-btn--main" (click)="openReport.emit(d.name)">
              {{ (hasReport(d.name) ? 'WIZARD.STEP3.REPORT_VIEW' : 'WIZARD.STEP3.GRID_DEEPEN') | translate }}
            </button>

            <div class="rg-rate">
              <button type="button" class="rg-icon"
                      [class.rg-icon--on]="d.rating === 'liked'"
                      [attr.aria-label]="'WIZARD.STEP3.RATE_LIKED' | translate"
                      [attr.aria-pressed]="d.rating === 'liked'"
                      (click)="rate.emit({ result: d, rating: d.rating === 'liked' ? 'neutral' : 'liked' })">
                <i class="pi" [class.pi-thumbs-up-fill]="d.rating === 'liked'" [class.pi-thumbs-up]="d.rating !== 'liked'"></i>
              </button>
              <button type="button" class="rg-icon"
                      [class.rg-icon--off]="d.rating === 'disliked'"
                      [attr.aria-label]="'WIZARD.STEP3.RATE_DISLIKED' | translate"
                      [attr.aria-pressed]="d.rating === 'disliked'"
                      (click)="rate.emit({ result: d, rating: d.rating === 'disliked' ? 'neutral' : 'disliked' })">
                <i class="pi" [class.pi-thumbs-down-fill]="d.rating === 'disliked'" [class.pi-thumbs-down]="d.rating !== 'disliked'"></i>
              </button>
            </div>
          </div>

          <!-- Analyse IA : conservée, la maquette l'ignore mais c'est une
               fonction du produit. -->
          @if (d.analysisPending) {
            <p class="rg-analysis-pending">
              <i class="pi pi-spin pi-spinner"></i> {{ 'WIZARD.STEP3.ANALYSIS_PENDING' | translate }}
            </p>
          } @else if (d.analysis && d.rating === 'liked') {
            <button type="button" class="rg-stars" (click)="toggleAnalysis.emit(d.id)"
                    [attr.aria-expanded]="expandedAnalysisId() === d.id"
                    [attr.aria-label]="'WIZARD.STEP3.ANALYSIS_TOGGLE' | translate">
              @for (filled of stars(d.analysis); track $index) {
                <i class="pi" [class.pi-star-fill]="filled" [class.pi-star]="!filled"></i>
              }
              <i class="pi pi-chevron-down rg-stars__chev"
                 [style.transform]="expandedAnalysisId() === d.id ? 'rotate(180deg)' : 'rotate(0deg)'"></i>
            </button>
            @if (expandedAnalysisId() === d.id) {
              <div class="rg-analysis" [innerHTML]="analysisHtml(d.analysis)"></div>
            }
          }
        </article>
      }
    </div>
  `,
  styleUrl: './results-grid.css',
})
export class ResultsGridComponent {
  /**
   * Entrées SIGNAL et non `@Input` classiques : `visible()` et `debited()` sont
   * des `computed`, qui ne suivent que des signaux. Avec des entrées ordinaires
   * ils auraient été calculés une fois puis figés — la grille aurait cessé de
   * se mettre à jour dès la première vérification de domaine arrivée.
   */
  readonly domains = input.required<any[]>();
  readonly extensions = input.required<string[]>();
  /** Noms déjà pourvus d'un rapport, normalisés par le wizard. */
  readonly reportedNames = input<Set<string>>(new Set());
  readonly reportCost = input(50);
  readonly isLocal = input(false);
  readonly expandedAnalysisId = input<string | null>(null);
  /** Rendu du markdown d'analyse : le wizard possède déjà le sanitizer. */
  readonly analysisRenderer = input<(a: string | null) => SafeHtml>(() => '' as unknown as SafeHtml);
  /**
   * Normalisation des noms. Doit rester identique à `normName()` du wizard,
   * qui alimente `reportedNames` — sans quoi un rapport acheté ne serait pas
   * reconnu sur la carte correspondante.
   */
  readonly normalize = input<(n: string) => string>((n) => (n || '').trim().toLowerCase());

  readonly rate = output<{ result: any; rating: 'liked' | 'disliked' | 'neutral' }>();
  readonly openReport = output<string>();
  readonly toggleAnalysis = output<string>();

  readonly filter = signal<'all' | 'free' | 'report' | 'fav'>('all');

  readonly filters = [
    { key: 'all' as const,    label: 'WIZARD.STEP3.GRID_FILTER_ALL' },
    { key: 'free' as const,   label: 'WIZARD.STEP3.GRID_FILTER_FREE' },
    { key: 'report' as const, label: 'WIZARD.STEP3.GRID_FILTER_REPORT' },
    { key: 'fav' as const,    label: 'WIZARD.STEP3.GRID_FILTER_FAV' },
  ];

  /**
   * Filtrage LOCAL à l'affichage. Le wizard applique déjà les siens
   * (extensions, noms rejetés) ; celui-ci s'y ajoute sans toucher à sa logique.
   */
  readonly visible = computed(() => {
    const f = this.filter();
    return this.domains().filter((d) => {
      if (f === 'free') return this.freeCount(d) === this.extensions().length && this.extensions().length > 0;
      if (f === 'report') return this.hasReport(d.name);
      if (f === 'fav') return d.rating === 'liked';
      return true;
    });
  });

  /** Crédits débités : 1 par domaine libre, sur l'ensemble des noms. */
  readonly debited = computed(() =>
    this.domains().reduce((n, d) => n + this.freeCount(d), 0),
  );

  freeCount(d: any): number {
    return this.extensions().filter((e) => d.allExtensions?.[e] === true).length;
  }

  hasReport(name: string): boolean {
    return this.reportedNames().has(this.normalize()(name));
  }

  verdicts(d: any): ExtVerdict[] {
    return this.extensions().map((ext) => {
      const state = d.allExtensions?.[ext];
      const key: ExtVerdict['key'] =
        state === true ? 'free' : state === false ? 'taken' : state === null ? 'unknown' : 'pending';
      // L'extension est stockée avec ou sans point selon l'origine de la donnée.
      const suffix = ext.startsWith('.') ? ext : '.' + ext;
      return { ext, domain: d.name.toLowerCase() + suffix, state, key };
    });
  }

  /**
   * Trois états, jamais deux. « non vérifiable » ne se confond ni avec
   * « libre » ni avec « pris » : c'est la règle de fond du produit.
   */
  stateLabel(key: ExtVerdict['key']): string {
    return key === 'free'
      ? 'WIZARD.STEP3.GRID_FREE'
      : key === 'taken'
        ? 'WIZARD.STEP3.GRID_TAKEN'
        : 'WIZARD.STEP3.GRID_UNKNOWN';
  }

  /** Note sur 5, extraite du texte d'analyse par le wizard puis convertie. */
  stars(analysis: string | null): boolean[] {
    const m = analysis?.match(/(\d+(?:[.,]\d+)?)\s*\/\s*5/);
    const score = m ? Math.round(parseFloat(m[1].replace(',', '.'))) : 0;
    return Array.from({ length: 5 }, (_, i) => i < score);
  }

  analysisHtml(a: string | null): SafeHtml {
    return this.analysisRenderer()(a);
  }
}
