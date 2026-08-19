import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandReport, Availability, NameQuality, TrademarkHit } from '../../services/brand-report';

/**
 * Rapport de marque — état DÉBLOQUÉ, refonte étape 4.
 *
 * Affichage réutilisable et présentationnel. Utilisé par la page de partage
 * publique et par la page de vérification.
 *
 * Surface claire, contrairement à l'accueil et aux résultats : c'est un
 * document, fait pour être partagé, imprimé et relu. C'est aussi le levier
 * viral identifié dans le handoff, donc la seule page susceptible d'être vue
 * hors du produit.
 *
 * UNE section de marque et non deux, contrairement à la maquette. Celle-ci
 * montre « Marques françaises — INPI » et « Marques européennes — EUIPO » avec
 * un verdict chacune. Or l'API ne renvoie qu'un seul `trademark.match`, qui
 * couvre les deux offices ; ses `hits` portent bien une `collection` (FR / EU /
 * WO), mais pas de verdict par office. Scinder l'affichage supposerait
 * d'inventer deux verdicts à partir d'un seul — sur une question juridique,
 * c'est précisément ce qu'il ne faut pas faire. Les dépôts trouvés sont donc
 * listés avec leur office, et le périmètre est nommé explicitement.
 */
@Component({
  selector: 'app-brand-report-view',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (report; as r) {
      <article class="rv">

        <header class="rv-head">
          <div>
            <p class="rv-overline">
              {{ 'WIZARD.STEP3.REPORT_CTA' | translate }}
              @if (r.generatedAt) { · {{ r.generatedAt | date: 'd MMMM y, HH:mm' }} }
            </p>
            <h2 class="rv-name">{{ r.name }}</h2>
          </div>
          <div class="rv-head__actions">
            <span class="rv-summary" [class]="'rv-summary--' + summaryTone(r)">
              {{ summaryKey(r) | translate }}
            </span>
          </div>
        </header>

        <!-- Noms de domaine -->
        <section class="rv-section">
          <div class="rv-section__head">
            <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_DOMAINS' | translate }}</h3>
            <span class="rv-section__meta">RDAP · {{ r.generatedAt | date: 'HH:mm:ss' }}</span>
          </div>
          @for (d of r.domains; track d.domain) {
            <div class="rv-row">
              <span class="rv-row__label">{{ d.domain }}</span>
              @if (d.status === 'free') {
                <a class="rv-link" [href]="reserveUrl(r.name, d.extension, 0)" target="_blank" rel="noopener noreferrer">
                  <i class="pi pi-shopping-cart"></i> {{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }}
                </a>
              }
              <span class="rv-badge" [class]="'rv-badge--' + badgeTone(d.status)">
                {{ statusKey(d.status) | translate }}
              </span>
            </div>
          }
        </section>

        <!-- Marques — INPI et EUIPO, périmètre nommé explicitement -->
        <section class="rv-section">
          <div class="rv-section__head">
            <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_TRADEMARK_SCOPE' | translate }}</h3>
            @if (allClasses(r.trademark.hits); as cls) {
              @if (cls) { <span class="rv-section__meta">{{ 'WIZARD.STEP3.REPORT_CLASSES' | translate:{ list: cls } }}</span> }
            }
          </div>

          <div class="rv-row">
            <span class="rv-row__label">{{ 'WIZARD.STEP3.REPORT_TM_IDENTICAL' | translate:{ name: r.name } }}</span>
            <span class="rv-badge" [class]="'rv-badge--' + tmTone(r.trademark.match)">
              {{ tmHeadKey(r.trademark.match) | translate }}
            </span>
          </div>

          <p class="rv-explain" [innerHTML]="tmExplainKey(r.trademark.match) | translate"></p>

          @if (r.trademark.hits.length) {
            <ul class="rv-hits">
              @for (h of r.trademark.hits.slice(0, 8); track h.name + h.applicationNumber) {
                <li>
                  {{ h.name }}
                  <span style="color: var(--nm-text-light-3)">
                    ({{ officeLabel(h.collection) }}@if (h.classes.length) { · {{ 'WIZARD.STEP3.REPORT_CLASSES' | translate:{ list: h.classes.join(', ') } }} })
                  </span>
                </li>
              }
            </ul>
          }

          <div class="rv-actions">
            @if (r.trademark.match === 'none' || r.trademark.match === 'similar') {
              <a class="rv-link" [href]="INPI_DEPOSIT_URL" target="_blank" rel="noopener noreferrer">
                <i class="pi pi-shield"></i> {{ 'WIZARD.STEP3.REPORT_DEPOSIT' | translate }}
              </a>
            }
            <a class="rv-link" [href]="r.trademark.deepLink" target="_blank" rel="noopener noreferrer">
              <i class="pi pi-search"></i> {{ 'WIZARD.STEP3.REPORT_OFFICIAL' | translate }}
            </a>
          </div>
        </section>

        <!-- Réseaux sociaux -->
        @if (r.socials.length) {
          <section class="rv-section">
            <div class="rv-section__head">
              <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_SOCIALS' | translate }}</h3>
              <span class="rv-section__meta">
                {{ 'WIZARD.STEP3.REPORT_PLATFORMS' | translate:{ n: r.socials.length } }}
              </span>
            </div>
            @for (s of r.socials; track s.platform) {
              <div class="rv-row">
                <span class="rv-row__label">
                  <a [href]="s.url" target="_blank" rel="noopener noreferrer">{{ s.platform }} · &#64;{{ r.handle }}</a>
                </span>
                @if (s.planned) {
                  <span class="rv-row__note">{{ 'WIZARD.STEP3.SOCIAL_SOON' | translate }}</span>
                }
                <span class="rv-badge" [class]="'rv-badge--' + badgeTone(s.status)">
                  {{ statusKey(s.status) | translate }}
                </span>
              </div>
            }
          </section>
        }

        <!-- Qualité du nom -->
        @if (r.quality; as q) {
          <section class="rv-section">
            <div class="rv-section__head">
              <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</h3>
              <span class="rv-section__meta">{{ q.score }}/100</span>
            </div>
            <div class="rv-criteria">
              @for (c of criteria(q); track c.label) {
                <span class="rv-criterion">{{ c.label }} <strong>{{ c.value }}/5</strong></span>
              }
            </div>
            @if (q.strengths) {
              <p class="rv-explain"><strong>{{ 'WIZARD.STEP3.REPORT_STRENGTHS' | translate }} :</strong> {{ q.strengths }}</p>
            }
            @if (q.watchout) {
              <p class="rv-explain"><strong>{{ 'WIZARD.STEP3.REPORT_WATCHOUT' | translate }} :</strong> {{ q.watchout }}</p>
            }
          </section>
        }

        <!-- Pied : avertissement obligatoire + action de réservation -->
        <footer class="rv-foot">
          <p class="rv-disclaimer">
            {{ r.disclaimer }}
            {{ 'WIZARD.STEP3.REPORT_SCOPE_NOTE' | translate }}
          </p>
          @if (heroFreeDomain(r); as hero) {
            <a class="rv-cta" [href]="reserveUrl(r.name, hero.extension, 0)" target="_blank" rel="noopener noreferrer">
              <i class="pi pi-shopping-cart"></i>
              {{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }} {{ hero.domain }}
            </a>
          }
        </footer>
      </article>
    }
  `,
  styleUrl: './brand-report-view.css',
})
export class BrandReportViewComponent {
  @Input({ required: true }) report!: BrandReport;

  readonly INPI_DEPOSIT_URL = 'https://procedures.inpi.fr/?/marques/depot';
  readonly REGISTRARS = [
    { label: 'OVH', base: 'https://www.ovhcloud.com/fr/domains/domain-name-checker/?q=' },
    { label: 'Namecheap', base: 'https://www.namecheap.com/domains/registration/results.aspx?domain=' },
    { label: 'Gandi', base: 'https://shop.gandi.net/fr/domain/suggest?search=' },
  ];

  reserveUrl(name: string, extension: string, i = 0): string {
    const d = `${name}.${extension}`.toLowerCase();
    return `${this.REGISTRARS[i].base}${d}&utm_source=namorama&utm_medium=referral`;
  }

  heroFreeDomain(r: BrandReport): { extension: string; domain: string } | null {
    const free = r.domains.filter((d) => d.status === 'free');
    return free.find((d) => d.extension === 'com') ?? free[0] ?? null;
  }

  statusKey(s: Availability): string {
    return s === 'free'
      ? 'WIZARD.STEP3.STATUS_FREE'
      : s === 'taken'
        ? 'WIZARD.STEP3.STATUS_TAKEN'
        : 'WIZARD.STEP3.STATUS_UNKNOWN';
  }

  /**
   * « unknown » a sa propre pastille, distincte de « pris » : un registre
   * injoignable n'est pas un verdict.
   */
  badgeTone(s: Availability): string {
    return s === 'free' ? 'free' : s === 'taken' ? 'taken' : 'unknown';
  }

  tmTone(match: string): string {
    return match === 'none' ? 'free' : match === 'exact' ? 'taken' : match === 'similar' ? 'watch' : 'unknown';
  }

  tmHeadKey(match: string): string {
    return `WIZARD.STEP3.TM_${(match || 'unknown').toUpperCase()}_HEAD`;
  }

  tmExplainKey(match: string): string {
    return `WIZARD.STEP3.TM_${(match || 'unknown').toUpperCase()}_EXPLAIN`;
  }

  /** Synthèse d'en-tête : le pire signal l'emporte, sans jamais l'adoucir. */
  summaryTone(r: BrandReport): 'ok' | 'watch' | 'risk' {
    if (r.trademark.match === 'exact') return 'risk';
    if (r.trademark.match === 'similar' || r.trademark.match === 'unknown') return 'watch';
    if (r.domains.some((d) => d.status === 'unknown')) return 'watch';
    return 'ok';
  }

  summaryKey(r: BrandReport): string {
    const t = this.summaryTone(r);
    return t === 'ok'
      ? 'WIZARD.STEP3.REPORT_SUMMARY_OK'
      : t === 'watch'
        ? 'WIZARD.STEP3.REPORT_SUMMARY_WATCH'
        : 'WIZARD.STEP3.REPORT_SUMMARY_RISK';
  }

  officeLabel(c?: 'FR' | 'EU' | 'WO'): string {
    return c === 'EU' ? 'EUIPO' : c === 'WO' ? 'OMPI' : 'INPI';
  }

  /** Classes de Nice rencontrées, dédupliquées et triées. */
  allClasses(hits: TrademarkHit[]): string {
    const s = new Set<number>();
    hits.forEach((h) => h.classes?.forEach((c) => s.add(c)));
    return [...s].sort((a, b) => a - b).join(', ');
  }

  private readonly QUALITY_LABELS: Record<string, string> = {
    memorability: 'Mémorabilité',
    pronunciation: 'Prononciation',
    international: 'International',
    seo: 'SEO',
    distinctiveness: 'Distinctivité',
  };

  criteria(q: NameQuality): { label: string; value: number }[] {
    return Object.entries(q.scores).map(([k, v]) => ({ label: this.QUALITY_LABELS[k] ?? k, value: v }));
  }
}
