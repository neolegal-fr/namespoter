import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandReport, Availability, NameQuality } from '../../services/brand-report';

/**
 * Affichage réutilisable et présentationnel d'un rapport de marque.
 * Utilisé par la page de partage publique et la page dédiée de vérification.
 * Suit la langue via ngx-translate (clés WIZARD.STEP3.*).
 */
@Component({
  selector: 'app-brand-report-view',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div style="display:flex;flex-direction:column;gap:1rem" *ngIf="report as r">

      <!-- Action héro : réserver le meilleur domaine libre -->
      <div *ngIf="heroFreeDomain(r) as hero" class="rv-hero">
        <div>
          <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;opacity:.85">{{ 'WIZARD.STEP3.REPORT_HERO_LABEL' | translate }}</div>
          <div style="font-family:monospace;font-size:1.25rem;font-weight:800;margin-top:.15rem">{{ hero.domain }}</div>
        </div>
        <a [href]="reserveUrl(r.name, hero.extension, 0)" target="_blank" rel="noopener noreferrer" class="rv-hero__btn">
          <i class="pi pi-shopping-cart"></i> {{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }}
        </a>
      </div>

      <!-- Scores -->
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <div class="rv-score">
          <div class="rv-score-n" [style.color]="col(r.score)">{{ r.score }}<span style="font-size:.9rem;color:#9ca3af">/100</span></div>
          <div class="rv-score-l">{{ 'WIZARD.STEP3.REPORT_AVAILABILITY' | translate }}</div>
        </div>
        <div *ngIf="r.quality as q" class="rv-score">
          <div class="rv-score-n" [style.color]="col(q.score)">{{ q.score }}<span style="font-size:.9rem;color:#9ca3af">/100</span></div>
          <div class="rv-score-l">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</div>
        </div>
      </div>

      <!-- Marque -->
      <div class="rv-card">
        <h3 class="rv-title">{{ 'WIZARD.STEP3.REPORT_TRADEMARK' | translate }}</h3>
        <span [ngSwitch]="r.trademark.match" style="font-weight:600">
          <span *ngSwitchCase="'none'" style="color:#16a34a"><i class="pi pi-check-circle"></i> {{ 'WIZARD.STEP3.TM_NONE_HEAD' | translate }}</span>
          <span *ngSwitchCase="'exact'" style="color:#dc2626"><i class="pi pi-times-circle"></i> {{ 'WIZARD.STEP3.TM_EXACT_HEAD' | translate }}</span>
          <span *ngSwitchCase="'similar'" style="color:#d97706"><i class="pi pi-exclamation-triangle"></i> {{ 'WIZARD.STEP3.TM_SIMILAR_HEAD' | translate }}</span>
          <span *ngSwitchDefault style="color:#9ca3af"><i class="pi pi-question-circle"></i> {{ 'WIZARD.STEP3.TM_UNKNOWN_HEAD' | translate }}</span>
        </span>
        <p [innerHTML]="tmExplainKey(r.trademark.match) | translate" style="margin:.5rem 0 0;color:#4b5563;font-size:.85rem;line-height:1.55"></p>
        <ul *ngIf="r.trademark.hits.length" style="margin:.6rem 0 .3rem;padding-left:1.1rem;color:#4b5563;font-size:.84rem">
          <li *ngFor="let h of r.trademark.hits.slice(0,8)">{{ h.name }} <span style="color:#9ca3af">({{ h.collection }}<span *ngIf="h.classes.length"> · classes {{ h.classes.join(', ') }}</span>)</span></li>
        </ul>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-top:.7rem">
          <a *ngIf="r.trademark.match === 'none' || r.trademark.match === 'similar'" [href]="INPI_DEPOSIT_URL" target="_blank" rel="noopener noreferrer" class="rv-cta">
            <i class="pi pi-shield" style="font-size:.8rem"></i> {{ 'WIZARD.STEP3.REPORT_DEPOSIT' | translate }}
          </a>
          <a [href]="r.trademark.deepLink" target="_blank" rel="noopener noreferrer"
             [ngClass]="r.trademark.match === 'unknown' ? 'rv-cta' : 'rv-link'" style="font-size:.82rem">
            <i class="pi pi-search" style="font-size:.75rem"></i> {{ 'WIZARD.STEP3.REPORT_OFFICIAL' | translate }}
          </a>
        </div>
      </div>

      <!-- Domaines + réseaux -->
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <div class="rv-card" style="flex:1 1 300px">
          <h3 class="rv-title">{{ 'WIZARD.STEP3.REPORT_DOMAINS' | translate }}</h3>
          <div *ngFor="let d of r.domains" class="rv-row">
            <span style="font-family:monospace">{{ d.domain }}</span>
            <span style="display:flex;align-items:center;gap:.6rem">
              <a *ngIf="d.status === 'free'" [href]="reserveUrl(r.name, d.extension, 0)" target="_blank" rel="noopener noreferrer" class="rv-link" style="font-size:.75rem">
                <i class="pi pi-shopping-cart" style="font-size:.65rem"></i> {{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }}
              </a>
              <span class="rv-badge" [style.background]="color(d.status)">{{ statusKey(d.status) | translate }}</span>
            </span>
          </div>
        </div>
        <div class="rv-card" style="flex:1 1 240px">
          <h3 class="rv-title">{{ 'WIZARD.STEP3.REPORT_SOCIALS' | translate }}</h3>
          <div *ngFor="let s of r.socials" class="rv-row">
            <a [href]="s.url" target="_blank" rel="noopener noreferrer" style="color:#374151;text-decoration:none">{{ s.platform }}<span *ngIf="s.planned" style="color:#9ca3af;font-size:.7rem"> ({{ 'WIZARD.STEP3.SOCIAL_SOON' | translate }})</span></a>
            <span class="rv-badge" [style.background]="color(s.status)">{{ statusKey(s.status) | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Qualité -->
      <div *ngIf="r.quality as q" class="rv-card">
        <h3 class="rv-title">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</h3>
        <div style="display:flex;flex-wrap:wrap;gap:.3rem 1.5rem">
          <div *ngFor="let c of criteria(q)" style="display:flex;justify-content:space-between;gap:1rem;min-width:180px;font-size:.86rem">
            <span>{{ c.label }}</span><span style="color:#6b7280;font-weight:600">{{ c.value }}/5</span>
          </div>
        </div>
        <p *ngIf="q.strengths" style="margin:.5rem 0 0;font-size:.85rem"><strong style="color:#16a34a">{{ 'WIZARD.STEP3.REPORT_STRENGTHS' | translate }} :</strong> {{ q.strengths }}</p>
        <p *ngIf="q.watchout" style="margin:.3rem 0 0;font-size:.85rem"><strong style="color:#d97706">{{ 'WIZARD.STEP3.REPORT_WATCHOUT' | translate }} :</strong> {{ q.watchout }}</p>
      </div>

      <p style="margin:0;padding:.7rem .85rem;background:#f1f5f9;border-radius:8px;font-size:.74rem;color:#6b7280">{{ r.disclaimer }}</p>
    </div>
  `,
  styles: [`
    .rv-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1rem 1.1rem; }
    .rv-title { font-size:.72rem; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; margin:0 0 .5rem; }
    .rv-row { display:flex; justify-content:space-between; align-items:center; gap:.75rem; font-size:.88rem; padding:.4rem 0; border-bottom:1px solid #f1f3f5; }
    .rv-badge { color:#fff; font-size:.72rem; font-weight:600; padding:2px 10px; border-radius:9999px; }
    .rv-link { color:#4f46e5; font-weight:600; text-decoration:none; }
    .rv-cta { display:inline-flex; align-items:center; gap:.4rem; background:#4f46e5; color:#fff; text-decoration:none; padding:.5rem 1rem; border-radius:9999px; font-weight:600; font-size:.85rem; }
    .rv-cta:hover { background:#4338ca; }
    .rv-score { flex:1 1 160px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:.9rem 1rem; text-align:center; }
    .rv-score-n { font-size:2rem; font-weight:800; line-height:1; }
    .rv-score-l { font-size:.72rem; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-top:.25rem; }
    .rv-hero { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; padding:1rem 1.2rem; border-radius:12px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; }
    .rv-hero__btn { display:inline-flex; align-items:center; gap:.4rem; padding:.6rem 1.1rem; border-radius:9999px; background:#fff; color:#4f46e5; font-weight:700; text-decoration:none; }
  `],
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
    return s === 'free' ? 'WIZARD.STEP3.STATUS_FREE' : s === 'taken' ? 'WIZARD.STEP3.STATUS_TAKEN' : 'WIZARD.STEP3.STATUS_UNKNOWN';
  }
  color(s: Availability): string { return s === 'free' ? '#16a34a' : s === 'taken' ? '#dc2626' : '#9ca3af'; }
  col(score: number): string { return score >= 66 ? '#16a34a' : score >= 33 ? '#d97706' : '#dc2626'; }
  tmExplainKey(match: string): string { return `WIZARD.STEP3.TM_${(match || 'unknown').toUpperCase()}_EXPLAIN`; }

  private readonly QUALITY_LABELS: Record<string, string> = {
    memorability: 'Mémorabilité', pronunciation: 'Prononciation', international: 'International', seo: 'SEO', distinctiveness: 'Distinctivité',
  };
  criteria(q: NameQuality): { label: string; value: number }[] {
    return Object.entries(q.scores).map(([k, v]) => ({ label: this.QUALITY_LABELS[k] ?? k, value: v }));
  }
}
