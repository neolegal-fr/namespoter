import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SafeHtml } from '@angular/platform-browser';
import { BrandReportSummary } from '../../services/brand-report';

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
        <article class="rg-card" [class.rg-card--strong]="allFree(d)">

          <header class="rg-card__head">
            <div class="rg-card__id">
              <h3 class="rg-card__name">{{ d.name }}</h3>
              @if (isLocal() && d.style && d.style !== 'standard') {
                <span class="rg-tag">
                  {{ (d.style === 'descriptive' ? 'WIZARD.STYLE.DESCRIPTIVE' : 'WIZARD.STYLE.CULTURAL') | translate }}
                </span>
              }
              @if (d.isManual) {
                <i class="pi pi-pencil rg-card__manual" [attr.aria-label]="'WIZARD.STEP3.MANUAL_TOOLTIP' | translate"></i>
              }
            </div>

            <!--
              Les pouces vivent DANS l'en-tête, à droite du nom : ils portent
              sur le nom, pas sur le rapport. Près du bouton d'achat, leur objet
              devenait ambigu.
            -->
            <div class="rg-rate">
              <button type="button" class="rg-icon"
                      [class.rg-icon--on]="isLiked(d)"
                      [attr.aria-label]="'WIZARD.STEP3.RATE_LIKED' | translate"
                      [attr.aria-pressed]="isLiked(d)"
                      (click)="rate.emit({ result: d, rating: isLiked(d) ? 'neutral' : 'liked' })">
                <i class="pi" [class.pi-thumbs-up-fill]="isLiked(d)" [class.pi-thumbs-up]="!isLiked(d)"></i>
              </button>
              <button type="button" class="rg-icon"
                      [class.rg-icon--off]="d.rating === 'disliked'"
                      [attr.aria-label]="'WIZARD.STEP3.RATE_DISLIKED' | translate"
                      [attr.aria-pressed]="d.rating === 'disliked'"
                      (click)="rate.emit({ result: d, rating: d.rating === 'disliked' ? 'neutral' : 'disliked' })">
                <i class="pi" [class.pi-thumbs-down-fill]="d.rating === 'disliked'" [class.pi-thumbs-down]="d.rating !== 'disliked'"></i>
              </button>
            </div>
          </header>

          <!-- Badge de synthèse : ce qui rend plusieurs noms vérifiés
               comparables d'un coup d'œil dans la grille. -->
          @if (summaryOf(d); as sum) {
            <p class="rg-synth" [class]="'rg-synth--' + synthTone(sum)">{{ synthKey(sum) | translate }}</p>
          } @else {
            <span class="rg-cost" [class.rg-cost--accent]="allFree(d)">
              {{ 'WIZARD.STEP3.GRID_CREDIT_ONE' | translate }}
            </span>
          }

          <!--
            Règle d'alignement : les six lignes existent dans LES DEUX états, au
            même endroit et dans le même ordre. Seule la colonne de droite
            change — de « non vérifié » au verdict réel. Rien ne se déplace après
            l'achat, ce qui rend comparables un nom vérifié et un nom qui ne
            l'est pas.
          -->
          <ul class="rg-rows">
            @for (v of verdicts(d); track v.ext) {
              <li class="rg-row">
                <span class="rg-row__label">{{ v.domain }}</span>
                @switch (v.key) {
                  @case ('pending') {
                    <span class="rg-row__value rg-row__value--pending">
                      <i class="pi pi-spin pi-spinner"></i> {{ 'WIZARD.STEP3.GRID_CHECKING' | translate }}
                    </span>
                  }
                  @default {
                    <span class="rg-row__value" [class]="'rg-v--' + v.key">{{ stateLabel(v.key) | translate }}</span>
                  }
                }
              </li>
            }

            <!-- L'analyse est une LIGNE LIBELLÉE, pas un ornement flottant :
                 sans libellé, on y lit une note de disponibilité ou un avis. -->
            @if (d.analysisPending) {
              <li class="rg-row">
                <span class="rg-row__label">{{ 'WIZARD.STEP3.GRID_ANALYSIS' | translate }}</span>
                <span class="rg-row__value rg-row__value--pending"><i class="pi pi-spin pi-spinner"></i></span>
              </li>
            } @else if (d.analysis) {
              <li class="rg-row">
                <span class="rg-row__label">{{ 'WIZARD.STEP3.GRID_ANALYSIS' | translate }}</span>
                <button type="button" class="rg-stars" (click)="toggleAnalysis.emit(d.id)"
                        [attr.aria-expanded]="expandedAnalysisId() === d.id"
                        [attr.aria-label]="'WIZARD.STEP3.ANALYSIS_TOGGLE' | translate">
                  @for (filled of stars(d.analysis); track $index) {
                    <i class="pi" [class.pi-star-fill]="filled" [class.pi-star]="!filled"></i>
                  }
                  <i class="pi pi-chevron-down rg-stars__chev"
                     [style.transform]="expandedAnalysisId() === d.id ? 'rotate(180deg)' : 'rotate(0deg)'"></i>
                </button>
              </li>
            }
          </ul>

          @if (expandedAnalysisId() === d.id && d.analysis) {
            <div class="rg-analysis" [innerHTML]="analysisHtml(d.analysis)"></div>
          }

          <div class="rg-sep" aria-hidden="true"></div>

          <!-- Palier payant : trois lignes, jamais une seule mention. Elles
               nomment les registres et les plateformes, ce qui dispense le
               bouton de les répéter. -->
          <ul class="rg-rows">
            <li class="rg-row">
              <span class="rg-row__label">{{ 'WIZARD.STEP3.GRID_TM_INPI' | translate }}</span>
              @if (summaryOf(d); as sum) {
                <span class="rg-row__value" [class]="'rg-v--' + tmTone(sum, 'inpi')">{{ tmKey(sum, 'inpi') | translate }}</span>
              } @else {
                <span class="rg-row__value rg-row__value--locked"><i class="pi pi-lock"></i> {{ 'WIZARD.STEP3.GRID_UNVERIFIED' | translate }}</span>
              }
            </li>
            <li class="rg-row">
              <span class="rg-row__label">{{ 'WIZARD.STEP3.GRID_TM_EUIPO' | translate }}</span>
              @if (summaryOf(d); as sum) {
                <span class="rg-row__value" [class]="'rg-v--' + tmTone(sum, 'euipo')">{{ tmKey(sum, 'euipo') | translate }}</span>
              } @else {
                <span class="rg-row__value rg-row__value--locked"><i class="pi pi-lock"></i> {{ 'WIZARD.STEP3.GRID_UNVERIFIED' | translate }}</span>
              }
            </li>

            <!--
              Une ligne de pastilles plutôt qu'une ligne par plateforme : quatre
              lignes de plus par carte feraient un mur sur neuf cartes, alors que
              les pastilles nomment chaque réseau et montrent chaque état.
              Le détail compte — un produit B2B se soucie de LinkedIn, une marque
              grand public de TikTok.
              Accessibilité : la couleur ne porte jamais l'information seule, un
              symbole l'accompagne ; le nom complet et l'état sont dans « title »,
              et le symbole est aria-hidden.
            -->
            <li class="rg-row">
              <span class="rg-row__label">{{ 'WIZARD.STEP3.GRID_SOCIALS' | translate }}</span>
              <span class="rg-socials">
                @for (s of socialsOf(d); track s.code) {
                  <span class="rg-social" [class]="'rg-social--' + s.tone" [attr.title]="s.title">
                    <span class="rg-social__code">{{ s.code }}</span>
                    <span class="rg-social__mark" aria-hidden="true">{{ s.mark }}</span>
                  </span>
                }
              </span>
            </li>
          </ul>

          <div class="rg-actions">
            @if (summaryOf(d); as sum) {
              <p class="rg-verified">
                {{ 'WIZARD.STEP3.GRID_VERIFIED_ON' | translate:{ date: (sum.verifiedAt | date: 'd MMM') } }}
                <button type="button" class="rg-refresh" (click)="refresh.emit(d.name)">
                  {{ 'WIZARD.STEP3.GRID_REFRESH' | translate }}
                </button>
              </p>
              <button type="button" class="rg-btn rg-btn--ghost" (click)="openReport.emit(d.name)">
                {{ 'WIZARD.STEP3.GRID_FULL_REPORT' | translate }}
              </button>
            } @else {
              <!-- AUCUN PRIX sur ce bouton : à ce stade l'utilisateur ne sait pas
                   encore ce que la vérification lui apporte, un tarif ne peut que
                   l'arrêter. Le prix — et la mention « offert ce mois-ci » —
                   appartiennent à la popup, après le contexte. -->
              <button type="button" class="rg-btn rg-btn--buy" (click)="verify.emit(d.name)">
                {{ 'WIZARD.STEP3.GRID_VERIFY' | translate }}
              </button>
              <button type="button" class="rg-btn rg-btn--ghost" (click)="openReport.emit(d.name)">
                {{ 'WIZARD.STEP3.GRID_FULL_REPORT' | translate }}
              </button>
            }
          </div>
        </article>
      }
    </div>
  `,
  styleUrl: './results-grid.css',
})
export class ResultsGridComponent {
  private readonly translate = inject(TranslateService);
  /**
   * Entrées SIGNAL et non `@Input` classiques : `visible()` et `debited()` sont
   * des `computed`, qui ne suivent que des signaux. Avec des entrées ordinaires
   * ils auraient été calculés une fois puis figés — la grille aurait cessé de
   * se mettre à jour dès la première vérification de domaine arrivée.
   */
  readonly domains = input.required<any[]>();
  readonly extensions = input.required<string[]>();
  /** Synthèses des noms vérifiés, indexées par nom normalisé. */
  readonly summaries = input<BrandReportSummary[]>([]);
  readonly reportCost = input(50);
  readonly isLocal = input(false);
  readonly expandedAnalysisId = input<string | null>(null);
  readonly analysisRenderer = input<(a: string | null) => SafeHtml>(() => '' as unknown as SafeHtml);
  /**
   * Normalisation des noms. Doit rester identique à `normName()` du wizard,
   * qui alimente les synthèses — sans quoi un nom vérifié ne serait pas
   * reconnu sur sa carte.
   */
  readonly normalize = input<(n: string) => string>((n) => (n || '').trim().toLowerCase());

  readonly rate = output<{ result: any; rating: 'liked' | 'disliked' | 'neutral' }>();
  readonly openReport = output<string>();
  readonly verify = output<string>();
  readonly refresh = output<string>();
  readonly toggleAnalysis = output<string>();

  readonly filter = signal<'all' | 'free' | 'report' | 'fav'>('all');

  readonly filters = [
    { key: 'all' as const,    label: 'WIZARD.STEP3.GRID_FILTER_ALL' },
    { key: 'free' as const,   label: 'WIZARD.STEP3.GRID_FILTER_FREE' },
    { key: 'report' as const, label: 'WIZARD.STEP3.GRID_FILTER_REPORT' },
    { key: 'fav' as const,    label: 'WIZARD.STEP3.GRID_FILTER_FAV' },
  ];

  private readonly byName = computed(() => {
    const m = new Map<string, BrandReportSummary>();
    for (const s of this.summaries()) m.set(s.nameKey, s);
    return m;
  });

  summaryOf(d: any): BrandReportSummary | undefined {
    return this.byName().get(this.normalize()(d.name));
  }

  /**
   * Vérifier vaut approbation : dépenser 50 crédits sur un nom est le signal
   * d'intérêt le plus fort du produit, bien plus fiable qu'un clic sur un
   * pouce. Le pouce s'affiche donc actif sur une carte vérifiée — et reste
   * cliquable pour se dédire.
   */
  isLiked(d: any): boolean {
    return d.rating === 'liked' || (!!this.summaryOf(d) && d.rating !== 'disliked');
  }

  /**
   * Filtrage LOCAL à l'affichage, puis tri par ENGAGEMENT — vérifiés, aimés,
   * puis ordre de génération. La grille remonte ainsi d'elle-même la liste
   * courte : après deux vérifications, les finalistes sont les deux premières
   * cartes, sans tri manuel.
   *
   * Tri STABLE, obligatoire : deux noms de même rang gardent leur ordre de
   * génération. Sans cela les cartes se réordonnent sous le curseur à chaque
   * notation. `Array.prototype.sort` est stable depuis ES2019, mais on trie
   * une copie — trier `domains()` en place muterait l'entrée du parent.
   */
  readonly visible = computed(() => {
    const f = this.filter();
    const kept = this.domains().filter((d) => {
      if (f === 'free') return this.allFree(d);
      if (f === 'report') return !!this.summaryOf(d);
      if (f === 'fav') return this.isLiked(d);
      return true;
    });
    const rank = (d: any) => (this.summaryOf(d) ? 0 : this.isLiked(d) ? 1 : 2);
    return [...kept].sort((a, b) => rank(a) - rank(b));
  });

  /**
   * Crédits débités : 1 par SUGGESTION retenue, pas par domaine libre.
   * C'est ce que facture l'API (`actualCost = results.length`) ; compter les
   * domaines libres affichait un total sans rapport avec le solde réel.
   */
  readonly debited = computed(() => this.domains().length);

  /** Toutes les extensions demandées sont libres — le cas que l'on cherche. */
  allFree(d: any): boolean {
    const exts = this.extensions();
    return exts.length > 0 && this.freeCount(d) === exts.length;
  }

  freeCount(d: any): number {
    return this.extensions().filter((e) => d.allExtensions?.[e] === true).length;
  }

  verdicts(d: any): ExtVerdict[] {
    return this.extensions().map((ext) => {
      const state = d.allExtensions?.[ext];
      const key: ExtVerdict['key'] =
        state === true ? 'free' : state === false ? 'taken' : state === null ? 'unknown' : 'pending';
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

  /**
   * Verdict de marque par office. L'API n'expose qu'un `match` couvrant les
   * deux : on ne l'éclate pas en deux verdicts inventés — chaque office reprend
   * le verdict global, et la présence de dépôts dans sa collection le nuance.
   * Sur une question juridique, mieux vaut répéter que deviner.
   */
  tmTone(sum: BrandReportSummary, office: 'inpi' | 'euipo'): string {
    const hits = office === 'inpi' ? sum.inpiHits : sum.euipoHits;
    if (sum.trademark === 'exact' && hits) return 'taken';
    if (sum.trademark === 'unknown') return 'unknown';
    if (sum.trademark === 'similar' && hits) return 'watch';
    return 'free';
  }

  tmKey(sum: BrandReportSummary, office: 'inpi' | 'euipo'): string {
    const t = this.tmTone(sum, office);
    return t === 'taken'
      ? 'WIZARD.STEP3.GRID_TM_FILED'
      : t === 'watch'
        ? 'WIZARD.STEP3.GRID_TM_CLOSE'
        : t === 'unknown'
          ? 'WIZARD.STEP3.GRID_UNKNOWN'
          : 'WIZARD.STEP3.GRID_TM_NONE';
  }

  /**
   * Pastilles de réseaux. Abréviations en attendant les glyphes officiels
   * monochromes : redessiner une marque déposée serait pire que rien. Ne
   * jamais employer les logos EN COULEURS — le rose d'Instagram et le cyan de
   * TikTok entreraient en conflit avec le code libre/pris, qui est
   * l'information utile.
   */
  private readonly PLATFORMS = [
    { code: 'IG', name: 'Instagram' },
    { code: 'in', name: 'LinkedIn' },
    { code: 'X',  name: 'X' },
    { code: 'TT', name: 'TikTok' },
  ];

  socialsOf(d: any): { code: string; tone: string; mark: string; title: string }[] {
    const sum = this.summaryOf(d);
    const t = (k: string) => this.translate.instant(k) as string;
    return this.PLATFORMS.map((p) => {
      const found = sum?.socials.find((s) => s.platform.toLowerCase() === p.name.toLowerCase());
      if (!sum || !found) {
        return { code: p.code, tone: 'locked', mark: '🔒', title: `${p.name} — ${t('WIZARD.STEP3.GRID_UNVERIFIED')}` };
      }
      const tone = found.status === 'free' ? 'free' : found.status === 'taken' ? 'taken' : 'unknown';
      const mark = tone === 'free' ? '✓' : tone === 'taken' ? '✗' : '?';
      const label = t(tone === 'free' ? 'WIZARD.STEP3.GRID_FREE' : tone === 'taken' ? 'WIZARD.STEP3.GRID_TAKEN' : 'WIZARD.STEP3.GRID_UNKNOWN');
      return { code: p.code, tone, mark, title: `${p.name} — ${label}` };
    });
  }

  /** Synthèse : le pire signal l'emporte, jamais adouci. */
  synthTone(sum: BrandReportSummary): 'ok' | 'watch' | 'risk' {
    const blockers = [this.tmTone(sum, 'inpi'), this.tmTone(sum, 'euipo')].filter((t) => t === 'taken').length
      + sum.socials.filter((s) => s.status === 'taken').length;
    if (blockers >= 2) return 'risk';
    if (blockers === 1 || sum.trademark === 'similar' || sum.trademark === 'unknown') return 'watch';
    return 'ok';
  }

  synthKey(sum: BrandReportSummary): string {
    const t = this.synthTone(sum);
    return t === 'ok' ? 'WIZARD.STEP3.GRID_SYNTH_OK' : t === 'watch' ? 'WIZARD.STEP3.GRID_SYNTH_WATCH' : 'WIZARD.STEP3.GRID_SYNTH_RISK';
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
