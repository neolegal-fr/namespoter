import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandReportService, BrandReport } from '../../services/brand-report';
import { BrandReportViewComponent } from '../brand-report/brand-report-view';
import { applyContentSeo } from './content-seo';

/**
 * Rapport partagé par lien — `/rapport/:token`.
 *
 * Quiconque a l'URL voit le rapport, en lecture seule et sans compte. C'est
 * l'objet même du lien : on l'envoie par message, l'autre l'ouvre, point. Le
 * jeton est un UUID tiré au hasard à l'achat du rapport ; il ne se devine pas,
 * et rien d'autre ne s'en déduit.
 *
 * La page est en `noindex` : le lien peut être collé n'importe où, il ne doit
 * pas se retrouver dans un moteur de recherche. Elle n'est pas pour autant
 * interdite au crawl — une URL bloquée par robots.txt peut être indexée sur la
 * foi d'un lien entrant, et l'instruction `noindex`, invisible au robot,
 * n'aurait alors jamais l'occasion de s'appliquer.
 *
 * Le rendu est celui du VRAI rapport (`app-brand-report-view`) : cette page
 * avait son propre gabarit, avec ses couleurs et un fond blanc en dur — le
 * document partagé ne ressemblait donc pas au document acheté, et sortait en
 * blanc sur blanc en thème sombre.
 */
@Component({
  selector: 'app-rapport-partage',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, BrandReportViewComponent],
  template: `
    <div class="rp-partage">
      <!-- Pas de logo ici : la barre de l'application en porte déjà un, juste
           au-dessus. Deux « Namorama » l'un sous l'autre donnaient à croire à
           deux en-têtes empilés. -->
      <div class="rp-partage__barre">
        <p class="rp-partage__intro">{{ 'SHARED_REPORT.TITLE' | translate }}</p>
        <a routerLink="/app" class="rp-cta">{{ 'SHARED_REPORT.CREATE_CTA' | translate }}</a>
      </div>

      @if (loading()) {
        <p class="rp-partage__etat">{{ 'SHARED_REPORT.LOADING' | translate }}</p>
      } @else if (error()) {
        <p class="rp-partage__etat rp-partage__etat--ko">{{ 'SHARED_REPORT.NOT_FOUND' | translate }}</p>
        <a routerLink="/app" class="rp-cta">{{ 'SHARED_REPORT.GENERATE' | translate }}</a>
      } @else if (report(); as r) {
        <app-brand-report-view [report]="r"></app-brand-report-view>

        <section class="rp-partage__suite">
          <h2>{{ 'SHARED_REPORT.OWN_TITLE' | translate }}</h2>
          <p>{{ 'SHARED_REPORT.OWN_LEAD' | translate }}</p>
          <a routerLink="/app" class="rp-cta">{{ 'SHARED_REPORT.GENERATE' | translate }}</a>
        </section>
      }
    </div>
  `,
  styles: [`
    .rp-partage { width: 100%; max-width: 62rem; margin: 0 auto; padding: 1.5rem 0.5rem 3rem; }
    .rp-partage__barre { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; padding: 0 0.5rem; }
    .rp-partage__marque { font-family: var(--nm-font-display); font-weight: 800; font-size: 1.1rem; color: var(--nm-app-accent); text-decoration: none; }
    .rp-partage__intro { margin: 0 0 0.5rem; padding: 0 0.5rem; font-size: var(--nm-text-overline-sm); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--nm-app-text-2); }
    .rp-partage__etat { padding: 0 0.5rem; color: var(--nm-app-text-2); }
    .rp-partage__etat--ko { color: var(--nm-app-verdict-taken-fg); }
    .rp-partage__suite { margin-top: 2rem; padding: 1.5rem 1rem; border: 1px solid var(--nm-app-border); border-radius: var(--nm-radius-lg); background: var(--nm-app-surface); text-align: center; }
    .rp-partage__suite h2 { margin: 0 0 0.35rem; font-family: var(--nm-font-display); font-size: var(--nm-text-h3); }
    .rp-partage__suite p { margin: 0 0 1rem; color: var(--nm-app-text-2); }
    .rp-cta { display: inline-flex; align-items: center; min-height: var(--nm-touch-min); padding: 0.55rem 1.1rem; border-radius: var(--nm-radius-sm); background: var(--nm-app-accent-fill); color: var(--nm-app-on-accent); font-weight: 700; text-decoration: none; }
    .rp-cta:hover { background: var(--nm-app-accent-fill-hover); }
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

    // Titre neutre et NOINDEX : le nom examiné ne doit apparaître ni dans un
    // moteur de recherche, ni dans un aperçu de partage automatique.
    applyContentSeo({
      title: 'Rapport de marque partagé',
      description: 'Rapport de disponibilité partagé par son auteur.',
      path: `/rapport/${token}`,
      noindex: true,
    });

    this.reports.shared(token).subscribe({
      next: (r) => { this.report.set(r); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
