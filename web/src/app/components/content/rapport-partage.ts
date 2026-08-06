import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BrandReportService, BrandReport, Availability, NameQuality } from '../../services/brand-report';

/**
 * Page publique en lecture seule d'un rapport partagé (Sally #5).
 * Rendu client (le jeton est dynamique) ; réutilise les clés i18n du wizard.
 */
@Component({
  selector: 'app-rapport-partage',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div style="max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem">
        <a routerLink="/" style="font-weight: 800; font-size: 1.1rem; color: #4f46e5; text-decoration: none">Namorama</a>
        <a routerLink="/app" class="rp-cta">Créez votre propre rapport →</a>
      </div>

      @if (loading()) {
        <p style="color: #6b7280">Chargement du rapport…</p>
      } @else if (error()) {
        <p style="color: #dc2626">Ce rapport n'existe pas ou n'est plus disponible.</p>
        <a routerLink="/app" class="rp-cta">Générer un rapport</a>
      } @else if (report(); as report) {
        <div style="font-size: 0.72rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em">Rapport de disponibilité de marque</div>
        <h1 style="font-family: monospace; margin: 0.15rem 0 1rem">{{ report.name }}</h1>

        <!-- Scores -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem">
          <div class="rp-score">
            <div class="rp-score-n" [style.color]="col(report.score)">{{ report.score }}<span style="font-size:.9rem;color:#9ca3af">/100</span></div>
            <div class="rp-score-l">{{ 'WIZARD.STEP3.REPORT_AVAILABILITY' | translate }}</div>
          </div>
          <div *ngIf="report.quality as q" class="rp-score">
            <div class="rp-score-n" [style.color]="col(q.score)">{{ q.score }}<span style="font-size:.9rem;color:#9ca3af">/100</span></div>
            <div class="rp-score-l">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</div>
          </div>
        </div>

        <!-- Domaines + réseaux -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap">
          <div class="rp-card" style="flex: 1 1 300px">
            <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_DOMAINS' | translate }}</h3>
            <div *ngFor="let d of report.domains" class="rp-row">
              <span style="font-family: monospace">{{ d.domain }}</span>
              <span style="display:flex;align-items:center;gap:.6rem">
                <a *ngIf="d.status === 'free'" [href]="reserveUrl(report.name, d.extension)" target="_blank" rel="noopener noreferrer" class="rp-link">{{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }}</a>
                <span class="rp-badge" [style.background]="color(d.status)">{{ label(d.status) }}</span>
              </span>
            </div>
          </div>
          <div class="rp-card" style="flex: 1 1 240px">
            <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_SOCIALS' | translate }}</h3>
            <div *ngFor="let s of report.socials" class="rp-row">
              <a [href]="s.url" target="_blank" rel="noopener noreferrer" style="color:#374151;text-decoration:none">{{ s.platform }}</a>
              <span class="rp-badge" [style.background]="color(s.status)">{{ label(s.status) }}</span>
            </div>
          </div>
        </div>

        <!-- Marque -->
        <div class="rp-card" style="margin-top: 1rem">
          <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_TRADEMARK' | translate }}</h3>
          <div [ngSwitch]="report.trademark.match" style="font-weight: 600">
            <span *ngSwitchCase="'none'" style="color:#16a34a">Aucun dépôt identique trouvé</span>
            <span *ngSwitchCase="'exact'" style="color:#dc2626">Marque identique déjà déposée</span>
            <span *ngSwitchCase="'similar'" style="color:#d97706">Marques proches existantes</span>
            <span *ngSwitchDefault style="color:#9ca3af">Vérification indisponible</span>
          </div>
          <ul *ngIf="report.trademark.hits.length" style="margin:.5rem 0 0;padding-left:1.1rem;color:#4b5563;font-size:.84rem">
            <li *ngFor="let h of report.trademark.hits.slice(0,8)">{{ h.name }} <span style="color:#9ca3af">({{ h.collection }}<span *ngIf="h.classes.length"> · classes {{ h.classes.join(', ') }}</span>)</span></li>
          </ul>
        </div>

        <!-- Qualité -->
        <div *ngIf="report.quality as q" class="rp-card" style="margin-top: 1rem">
          <h3 class="rp-title">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</h3>
          <div style="display:flex;flex-wrap:wrap;gap:.3rem 1.5rem">
            <div *ngFor="let c of criteria(q)" style="display:flex;justify-content:space-between;gap:1rem;min-width:180px;font-size:.86rem">
              <span>{{ c.label }}</span><span style="color:#6b7280;font-weight:600">{{ c.value }}/5</span>
            </div>
          </div>
          <p *ngIf="q.strengths" style="margin:.5rem 0 0;font-size:.85rem"><strong style="color:#16a34a">{{ 'WIZARD.STEP3.REPORT_STRENGTHS' | translate }} :</strong> {{ q.strengths }}</p>
          <p *ngIf="q.watchout" style="margin:.3rem 0 0;font-size:.85rem"><strong style="color:#d97706">{{ 'WIZARD.STEP3.REPORT_WATCHOUT' | translate }} :</strong> {{ q.watchout }}</p>
        </div>

        <p style="margin:1rem 0 0;padding:.7rem .85rem;background:#f1f5f9;border-radius:8px;font-size:.74rem;color:#6b7280">{{ report.disclaimer }}</p>
        <div style="text-align:center;margin-top:1.5rem">
          <a routerLink="/app" class="rp-cta">Vérifiez votre propre nom de marque →</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .rp-cta { display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:.55rem 1.1rem; border-radius:8px; font-weight:600; }
    .rp-cta:hover { background:#4338ca; }
    .rp-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1rem 1.1rem; }
    .rp-title { font-size:.72rem; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; margin:0 0 .5rem; }
    .rp-row { display:flex; justify-content:space-between; align-items:center; gap:.75rem; font-size:.88rem; padding:.4rem 0; border-bottom:1px solid #f1f3f5; }
    .rp-badge { color:#fff; font-size:.72rem; font-weight:600; padding:2px 10px; border-radius:9999px; }
    .rp-link { color:#4f46e5; font-size:.75rem; font-weight:600; }
    .rp-score { flex:1 1 160px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:.9rem 1rem; text-align:center; }
    .rp-score-n { font-size:2rem; font-weight:800; line-height:1; }
    .rp-score-l { font-size:.72rem; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-top:.25rem; }
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

  label(s: Availability): string { return s === 'free' ? 'Libre' : s === 'taken' ? 'Pris' : '?'; }
  color(s: Availability): string { return s === 'free' ? '#16a34a' : s === 'taken' ? '#dc2626' : '#9ca3af'; }
  col(score: number): string { return score >= 66 ? '#16a34a' : score >= 33 ? '#d97706' : '#dc2626'; }
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
