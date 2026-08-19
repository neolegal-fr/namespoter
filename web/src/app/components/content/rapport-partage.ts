import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandReportService, BrandReport, Availability, NameQuality } from '../../services/brand-report';

/**
 * Page publique en lecture seule d'un rapport partagé (Sally #5).
 * Rendu client (le jeton est dynamique) ; réutilise les clés i18n du wizard.
 */
@Component({
  selector: 'app-rapport-partage',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div style="max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem">
        <a routerLink="/" style="font-weight: 800; font-size: 1.1rem; color: var(--nm-accent-on-light); text-decoration: none">Namorama</a>
        <a routerLink="/app" class="rp-cta">{{ 'SHARED_REPORT.CREATE_CTA' | translate }}</a>
      </div>

      @if (loading()) {
        <p style="color: var(--nm-text-light-2)">{{ 'SHARED_REPORT.LOADING' | translate }}</p>
      } @else if (error()) {
        <p style="color: var(--nm-verdict-taken-light-fg)">{{ 'SHARED_REPORT.NOT_FOUND' | translate }}</p>
        <a routerLink="/app" class="rp-cta">{{ 'SHARED_REPORT.GENERATE' | translate }}</a>
      } @else if (report(); as report) {
        <div style="font-size: var(--nm-text-ui-sm); color: var(--nm-text-light-2); text-transform: uppercase; letter-spacing: .05em">{{ 'SHARED_REPORT.TITLE' | translate }}</div>
        <h1 style="font-family: var(--nm-font-display); margin: 0.15rem 0 1rem">{{ report.name }}</h1>

        <!-- Scores -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem">
          <div class="rp-score">
            <div class="rp-score-n" [style.color]="col(report.score)">{{ report.score }}<span style="font-size:.9rem;color:var(--nm-text-light-3)">/100</span></div>
            <div class="rp-score-l">{{ 'WIZARD.STEP3.REPORT_AVAILABILITY' | translate }}</div>
          </div>
          <div *ngIf="report.quality as q" class="rp-score">
            <div class="rp-score-n" [style.color]="col(q.score)">{{ q.score }}<span style="font-size:.9rem;color:var(--nm-text-light-3)">/100</span></div>
            <div class="rp-score-l">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</div>
          </div>
        </div>

        <!-- Domaines + réseaux -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap">
          <div class="rp-card" style="flex: 1 1 300px">
            <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_DOMAINS' | translate }}</h3>
            <div *ngFor="let d of report.domains" class="rp-row">
              <span style="font-family: var(--nm-font-display)">{{ d.domain }}</span>
              <span style="display:flex;align-items:center;gap:.6rem">
                <a *ngIf="d.status === 'free'" [href]="reserveUrl(report.name, d.extension)" target="_blank" rel="noopener noreferrer" class="rp-link">{{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }}</a>
                <span class="rp-badge" [style.background]="color(d.status)">{{ statusKey(d.status) | translate }}</span>
              </span>
            </div>
          </div>
          <div class="rp-card" style="flex: 1 1 240px">
            <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_SOCIALS' | translate }}</h3>
            <div *ngFor="let s of report.socials" class="rp-row">
              <a [href]="s.url" target="_blank" rel="noopener noreferrer" style="color:var(--nm-text-on-card);text-decoration:none">{{ s.platform }}</a>
              <span class="rp-badge" [style.background]="color(s.status)">{{ statusKey(s.status) | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Marque -->
        <div class="rp-card" style="margin-top: 1rem">
          <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_TRADEMARK' | translate }}</h3>
          <div [ngSwitch]="report.trademark.match" style="font-weight: 600">
            <span *ngSwitchCase="'none'" style="color:var(--nm-verdict-free-light-fg)">{{ 'WIZARD.STEP3.TM_NONE_HEAD' | translate }}</span>
            <span *ngSwitchCase="'exact'" style="color:var(--nm-verdict-taken-light-fg)">{{ 'WIZARD.STEP3.TM_EXACT_HEAD' | translate }}</span>
            <span *ngSwitchCase="'similar'" style="color:var(--nm-verdict-watch-light-fg)">{{ 'WIZARD.STEP3.TM_SIMILAR_HEAD' | translate }}</span>
            <span *ngSwitchDefault style="color:var(--nm-text-light-3)">{{ 'WIZARD.STEP3.TM_UNKNOWN_HEAD' | translate }}</span>
          </div>
          <ul *ngIf="report.trademark.hits.length" style="margin:.5rem 0 0;padding-left:1.1rem;color:var(--nm-text-light-2);font-size:.84rem">
            <li *ngFor="let h of report.trademark.hits.slice(0,8)">{{ h.name }} <span style="color:var(--nm-text-light-3)">({{ h.collection }}<span *ngIf="h.classes.length"> · classes {{ h.classes.join(', ') }}</span>)</span></li>
          </ul>
        </div>

        <!-- Qualité -->
        <div *ngIf="report.quality as q" class="rp-card" style="margin-top: 1rem">
          <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</h3>
          <div style="display:flex;flex-wrap:wrap;gap:.3rem 1.5rem">
            <div *ngFor="let c of criteria(q)" style="display:flex;justify-content:space-between;gap:1rem;min-width:180px;font-size:.86rem">
              <span>{{ c.label }}</span><span style="color:var(--nm-text-light-2);font-weight:600">{{ c.value }}/5</span>
            </div>
          </div>
          <p *ngIf="q.strengths" style="margin:.5rem 0 0;font-size:.85rem"><strong style="color:var(--nm-verdict-free-light-fg)">{{ 'WIZARD.STEP3.REPORT_STRENGTHS' | translate }} :</strong> {{ q.strengths }}</p>
          <p *ngIf="q.watchout" style="margin:.3rem 0 0;font-size:.85rem"><strong style="color:var(--nm-verdict-watch-light-fg)">{{ 'WIZARD.STEP3.REPORT_WATCHOUT' | translate }} :</strong> {{ q.watchout }}</p>
        </div>

        <p style="margin:1rem 0 0;padding:.7rem .85rem;background:var(--nm-divider-light-1);border-radius:8px;font-size:.74rem;color:var(--nm-text-light-2)">{{ report.disclaimer }}</p>
        <div style="text-align:center;margin-top:1.5rem">
          <a routerLink="/app" class="rp-cta">{{ 'SHARED_REPORT.OWN_CTA' | translate }}</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .rp-cta { display:inline-block; background:var(--nm-accent-on-light); color:#fff; text-decoration:none; padding:.55rem 1.1rem; border-radius:8px; font-weight:600; }
    .rp-cta:hover { background:var(--nm-accent-on-light-hover); }
    .rp-card { background:#fff; border:1px solid var(--nm-border-light); border-radius:12px; padding:1rem 1.1rem; }
    .rp-title { font-size:.72rem; font-weight:700; color:var(--nm-text-light-2); text-transform:uppercase; letter-spacing:.05em; margin:0 0 .5rem; }
    .rp-row { display:flex; justify-content:space-between; align-items:center; gap:.75rem; font-size:.88rem; padding:.4rem 0; border-bottom:1px solid var(--nm-divider-light-2); }
    .rp-badge { color:#fff; font-size:.72rem; font-weight:600; padding:2px 10px; border-radius:9999px; }
    .rp-link { color:var(--nm-accent-on-light); font-size:.75rem; font-weight:600; }
    .rp-score { flex:1 1 160px; background:#fff; border:1px solid var(--nm-border-light); border-radius:12px; padding:.9rem 1rem; text-align:center; }
    .rp-score-n { font-size:2rem; font-weight:800; line-height:1; }
    .rp-score-l { font-size:.72rem; color:var(--nm-text-light-2); text-transform:uppercase; letter-spacing:.04em; margin-top:.25rem; }
  `],
})
export class RapportPartageComponent {
  private readonly reports = inject(BrandReportService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly report = signal<BrandReport | null>(null);

  constructor() {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.reports.shared(token).subscribe({
      next: (r) => { this.report.set(r); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  statusKey(s: Availability): string {
    return s === 'free' ? 'WIZARD.STEP3.STATUS_FREE' : s === 'taken' ? 'WIZARD.STEP3.STATUS_TAKEN' : 'WIZARD.STEP3.STATUS_UNKNOWN';
  }
  color(s: Availability): string { return s === 'free' ? 'var(--nm-verdict-free-light-fg)' : s === 'taken' ? 'var(--nm-verdict-taken-light-fg)' : 'var(--nm-text-light-3)'; }
  col(score: number): string { return score >= 66 ? 'var(--nm-verdict-free-light-fg)' : score >= 33 ? 'var(--nm-verdict-watch-light-fg)' : 'var(--nm-verdict-taken-light-fg)'; }
  reserveUrl(name: string, ext: string): string {
    const d = `${name}.${ext}`.toLowerCase();
    return `https://www.ovhcloud.com/fr/domains/domain-name-checker/?q=${d}&utm_source=namorama&utm_medium=referral`;
  }
  private readonly QUALITY_LABELS: Record<string, string> = {
    memorability: 'Mémorabilité', pronunciation: 'Prononciation', international: 'International', seo: 'SEO', distinctiveness: 'Distinctivité',
  };
  criteria(q: NameQuality): { label: string; value: number }[] {
    return Object.entries(q.scores).map(([k, v]) => ({ label: this.QUALITY_LABELS[k] ?? k, value: v }));
  }
}
