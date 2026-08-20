import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

/** Un contrôle annoncé, sans son verdict. Seul le libellé vient du serveur. */
interface LockedCheck {
  labelKey: string;
  params?: Record<string, unknown>;
  /** Largeur de la barre décorative, en pixels. Arbitraire et FIXE. */
  barWidth: number;
}

/**
 * rapport de marque — état VERROUILLÉ (avant achat), refonte étape 4.
 *
 * Montre la FORME de la réponse, jamais la réponse : c'est le ressort de
 * conversion décrit par le handoff.
 *
 * ┌─ Impératif de sécurité ────────────────────────────────────────────────┐
 * │ Les barres grises sont des placeholders DÉCORATIFS générés ici, côté   │
 * │ client. Le vrai verdict n'est jamais rendu puis masqué : un            │
 * │ `filter: blur()`, un `user-select: none`, un texte blanc sur blanc ou  │
 * │ un `display: none` sont purement visuels — la donnée resterait lisible │
 * │ dans le DOM, dans le source et dans les devtools, et le paywall à 50   │
 * │ crédits serait contournable en deux clics.                            │
 * │                                                                        │
 * │ Ce composant ne reçoit AUCUN verdict : ses entrées se limitent au nom, │
 * │ au prix et au nombre de domaines déjà vérifiés. Il n'y a donc rien à   │
 * │ fuiter, par construction, et non par discipline d'affichage.           │
 * │                                                                        │
 * │ Les largeurs de barres n'encodent aucune information : elles sont      │
 * │ fixes, choisies d'avance, et ne reflètent ni la longueur ni la nature  │
 * │ du verdict. Elles portent `aria-hidden`, n'ayant rien à annoncer.      │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Le pied de carte n'affiche PAS le rapport offert mensuel. L'API n'expose ni
 * `deepReport.freeThisMonth` ni `deepReport.purchased` (chantier back-end,
 * étape 9 du handoff) : afficher « offert ce mois-ci » sans savoir si le droit
 * est disponible reviendrait à promettre la gratuité au hasard, puis à débiter
 * 50 crédits. Le composant est prêt à le porter — `freeThisMonth` est une
 * entrée optionnelle, non renseignée tant que le serveur ne la fournit pas.
 */
@Component({
  selector: 'app-brand-report-locked',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <article class="rl">

      <header class="rl-head">
        <!-- Nom et sur-titre seulement quand le bloc est SEUL à l'écran :
             posé dans la page de rapport, il répéterait son en-tête à trois
             centimètres du premier. -->
        @if (!embedded()) {
          <p class="rl-overline">
            {{ 'WIZARD.STEP3.REPORT_CTA' | translate }} · {{ 'WIZARD.STEP3.LOCKED_NOT_UNLOCKED' | translate }}
          </p>
          <h2 class="rl-name">{{ name() }}</h2>
        }
        <p class="rl-intro">
          {{ 'WIZARD.STEP3.LOCKED_INTRO' | translate:{ n: domainsChecked(), credits: domainsChecked() } }}
        </p>
      </header>

      <section class="rl-checks">
        @for (c of checks; track c.labelKey) {
          <div class="rl-check">
            <span class="rl-check__label">{{ c.labelKey | translate:c.params }}</span>
            <!-- Décoratif : aucune donnée, rien à annoncer aux lecteurs d'écran. -->
            <span class="rl-bar" [style.width.px]="c.barWidth" aria-hidden="true"></span>
            <i class="pi pi-lock rl-check__lock" aria-hidden="true"></i>
          </div>
        }
      </section>

      <footer class="rl-foot">
        <div class="rl-price">
          <p class="rl-price__amount">
            <strong>{{ 'WIZARD.STEP3.GRID_CREDIT_MANY' | translate:{ n: priceCredits() } }}</strong>
            @if (freeThisMonth()) {
              <span class="rl-price__free">— {{ 'WIZARD.STEP3.LOCKED_FREE_THIS_MONTH' | translate }}</span>
            }
          </p>
          <p class="rl-price__note">
            @if (freeThisMonth()) {
              {{ 'WIZARD.STEP3.LOCKED_FREE_NOTE' | translate:{ n: priceCredits() } }}
            } @else {
              {{ 'WIZARD.STEP3.LOCKED_PAID_NOTE' | translate:{ n: priceCredits() } }}
            }
          </p>
        </div>

        <!--
          Solde insuffisant : le bouton mène aux packs plutôt que de lancer une
          opération qui échouera. Ne jamais proposer une action vouée à l'échec.
        -->
        @if (canAfford()) {
          <button type="button" class="rl-btn" (click)="unlock.emit()">
            {{ 'WIZARD.STEP3.LOCKED_UNLOCK' | translate }}
          </button>
        } @else {
          <button type="button" class="rl-btn rl-btn--topup" (click)="topUp.emit()">
            {{ 'WIZARD.STEP3.LOCKED_TOPUP' | translate }}
          </button>
        }
      </footer>
    </article>
  `,
  styleUrl: './brand-report-locked.css',
})
export class BrandReportLockedComponent {
  readonly name = input.required<string>();

  /** Posé DANS la page de rapport, sous les sections déjà collectées. */
  readonly embedded = input(false);
  readonly priceCredits = input(50);
  /** Domaines déjà vérifiés et facturés en amont, rappelés à l'utilisateur. */
  readonly domainsChecked = input(0);
  /** Le compte peut-il payer : solde suffisant, ou droit gratuit disponible. */
  readonly canAfford = input(true);
  /**
   * Droit au rapport offert du mois. Reste `false` tant que l'API n'expose pas
   * `deepReport.freeThisMonth` — on ne devine pas une gratuité.
   */
  readonly freeThisMonth = input(false);

  readonly unlock = output<void>();
  readonly topUp = output<void>();

  /**
   * Contrôles annoncés. Seuls les LIBELLÉS sont connus avant achat : ils
   * décrivent ce qui SERA fait, pas ce qui a été trouvé.
   *
   * Les largeurs sont fixes et arbitraires — elles ne dérivent d'aucune donnée.
   * Un tirage aléatoire aurait aussi bougé à chaque rendu, ce qui donne
   * l'impression d'un chargement en cours.
   */
  readonly checks: LockedCheck[] = [
    { labelKey: 'WIZARD.STEP3.LOCKED_CHECK_INPI',    barWidth: 132 },
    { labelKey: 'WIZARD.STEP3.LOCKED_CHECK_EUIPO',   barWidth: 104 },
    { labelKey: 'WIZARD.STEP3.LOCKED_CHECK_WO',      barWidth: 118 },
    { labelKey: 'WIZARD.STEP3.LOCKED_CHECK_SOCIALS', barWidth: 148 },
  ];
}
