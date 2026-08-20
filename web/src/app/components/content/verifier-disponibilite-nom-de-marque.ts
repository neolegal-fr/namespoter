import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import { timeout } from 'rxjs';
import { ArticleCtaComponent } from './article-cta';
import { applyContentSeo } from './content-seo';
import { BrandReportViewComponent } from '../brand-report/brand-report-view';
import { BrandReportService, BrandReport, Availability, BRAND_REPORT_COST } from '../../services/brand-report';

/**
 * Landing SEO (US-055) : « vérifier la disponibilité d'un nom de marque ».
 *
 * Intention transactionnelle en français, mal couverte par les outils US.
 * La page est prérendue (contenu indexable) ; le checker d'aperçu s'exécute
 * côté navigateur au clic (aucun appel réseau au prerender). L'aperçu est
 * volontairement bridé (domaine phare + quelques réseaux, sans marque) pour
 * démontrer la valeur et pousser vers le rapport de marque.
 */
@Component({
  selector: 'app-verifier-disponibilite-nom-de-marque',
  standalone: true,
  imports: [RouterModule, FormsModule, ArticleCtaComponent, BrandReportViewComponent],
  template: `
    <article class="article">
      <nav class="meta">
        <a routerLink="/">Accueil</a> &rsaquo; <a routerLink="/guides">Guides</a> &rsaquo; Vérifier une marque
      </nav>

      <h1>Vérifier la disponibilité d'un nom de marque</h1>
      <p class="lead">
        Avant de vous engager sur un nom, une question décide de tout&nbsp;: est-il <strong>réellement libre</strong>&nbsp;?
        Pas seulement le domaine — aussi les <strong>réseaux sociaux</strong> et surtout la <strong>marque déposée</strong>
        (INPI en France, EUIPO en Europe). Testez un nom ci-dessous&nbsp;: aperçu gratuit, immédiat.
      </p>

      <!-- Checker d'aperçu (client-side) -->
      <div class="checker">
        <div class="checker-row">
          <input type="text" [(ngModel)]="query" (keyup.enter)="check()"
                 placeholder="Ex. : Qonto, Namorama…" aria-label="Nom à vérifier" maxlength="60" />
          <button (click)="check()" [disabled]="loading() || !query().trim()">
            {{ loading() ? 'Vérification…' : 'Vérifier' }}
          </button>
        </div>

        @if (error()) {
          <p class="checker-error">{{ error() }}</p>
        }

        @if (report(); as r) {
          <div class="checker-result">
            <div class="cols">
              <div>
                <h3>Domaines</h3>
                @for (d of r.domains; track d.domain) {
                  <div class="line"><span>{{ d.domain }}</span> <span class="badge" [style.background]="color(d.status)">{{ label(d.status) }}</span></div>
                }
              </div>
              <div>
                <h3>Réseaux sociaux</h3>
                @for (s of r.socials; track s.platform) {
                  <div class="line"><span>{{ s.platform }}</span> <span class="badge" [style.background]="color(s.status)">{{ label(s.status) }}</span></div>
                }
              </div>
            </div>
            <p class="upsell">
              L'aperçu ne couvre que l'essentiel. Le <strong>rapport de marque</strong> ajoute
              tous les réseaux et la <strong>vérification de marque INPI + EUIPO</strong> (classes incluses),
              affiché et envoyé par email — {{ cost }} crédits.
            </p>
            <button class="cta" (click)="getFullReport()" [disabled]="fullLoading()">
              {{ fullLoading() ? 'Génération du rapport…' : (isLoggedIn() ? 'Obtenir le rapport de marque' : 'Se connecter pour le rapport de marque') }}
            </button>
            @if (fullError()) {
              <p class="checker-error">{{ fullError() }}</p>
              <button class="cta" (click)="getFullReport()" [disabled]="fullLoading()"><i class="pi pi-refresh"></i> Réessayer</button>
            }
          </div>
        }

        <!-- Rapport de marque -->
        @if (fullReport(); as fr) {
          <div style="margin-top: 1.5rem">
            <app-brand-report-view [report]="fr"></app-brand-report-view>
          </div>
        }
      </div>

      <h2 id="pourquoi">Domaine libre ne veut pas dire nom disponible</h2>
      <p>
        C'est l'angle mort le plus coûteux d'un lancement&nbsp;: un nom peut être libre en <code>.com</code> et
        <strong>déjà déposé comme marque</strong> dans votre classe de produits. Vous construisez alors une identité
        — logo, site, comptes sociaux, cartes — sur un nom que vous devrez abandonner à la première opposition, en
        perdant les redevances déjà versées. Vérifier la marque <em>avant</em> de s'attacher au nom coûte quelques
        secondes&nbsp;; le corriger après, des mois.
      </p>

      <h2 id="trois-plans">Les trois plans à vérifier</h2>
      <ul>
        <li><strong>Le domaine</strong> — la base, mais la partie la plus simple. Un nom sans <code>.com</code> reste viable&nbsp;;
          un nom déjà déposé en marque, non.</li>
        <li><strong>Les réseaux sociaux</strong> — un handle cohérent (Instagram, TikTok, LinkedIn, GitHub…) fait gagner
          en clarté de marque. Les pseudos identiques partent vite.</li>
        <li><strong>La marque déposée</strong> — le seul plan à portée juridique. Nous interrogeons les bases officielles
          <strong>INPI (France)</strong>, <strong>EUIPO (Union européenne)</strong> et <strong>OMPI (international)</strong>
          pour signaler les dépôts identiques ou proches, avec leurs <strong>classes de Nice</strong>.</li>
      </ul>

      <h2 id="indicatif">Un signal indicatif, pas un avis juridique</h2>
      <p>
        Notre vérification est un <strong>signal de disponibilité</strong> destiné à écarter très tôt les noms
        manifestement pris. Elle ne remplace pas une <strong>recherche d'antériorité</strong> complète (qui couvre aussi
        les similarités phonétiques et visuelles) ni l'avis d'un <strong>conseil en propriété industrielle</strong>. Pour
        un dépôt, appuyez-vous sur la recherche officielle de l'INPI et, au besoin, un professionnel — nous vous y
        renvoyons systématiquement.
      </p>

      <h2 id="comment">Comment ça marche</h2>
      <p>
        Saisissez un nom&nbsp;: nous vérifions le domaine par une requête réelle, la disponibilité des handles sociaux,
        et interrogeons les bases de marques. Le résultat est synthétisé en un <strong>score de disponibilité</strong> et,
        pour le rapport de marque, <strong>envoyé par email</strong> — un document que vous pouvez archiver ou partager avec
        un associé ou votre avocat.
      </p>

      <app-article-cta
        heading="Vérifiez votre nom de marque maintenant"
        subheading="Domaine, réseaux sociaux et marque déposée (INPI + EUIPO) en un seul rapport."
        label="Lancer une vérification"></app-article-cta>

      <h2 id="aussi">À lire aussi</h2>
      <ul>
        <li><a routerLink="/guides/trouver-nom-de-marque">Guide&nbsp;: trouver un nom de marque disponible</a></li>
        <li><a routerLink="/generateur-nom-de-produit">Générateur de nom de produit</a></li>
        <li><a routerLink="/nom-de-startup-court-invente">Noms courts et inventés, façon Qonto ou Stripe</a></li>
        <li><a routerLink="/comparatif-generateurs-de-noms">Comparatif des générateurs de noms</a></li>
      </ul>
    </article>
  `,
  styles: [`
    .checker { margin: 1.5rem 0 2rem; padding: 1.25rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
    .checker-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .checker-row input { flex: 1 1 200px; padding: 0.6rem 0.8rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; }
    .checker-row button { padding: 0.6rem 1.2rem; border: 0; border-radius: 8px; background: var(--nm-app-accent-fill); color: var(--nm-app-on-accent); font-weight: 600; cursor: pointer; }
    .checker-row button:disabled { opacity: .6; cursor: default; }
    .checker-error { color: #dc2626; margin: 0.75rem 0 0; }
    .checker-result { margin-top: 1rem; }
    .checker-result .cols { display: flex; gap: 2rem; flex-wrap: wrap; }
    .checker-result .cols > div { flex: 1 1 220px; }
    .checker-result h3 { font-size: 0.9rem; margin: 0 0 0.5rem; }
    .line { display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0; font-size: 0.9rem; border-bottom: 1px solid #eef0f2; }
    .badge { color: #fff; font-size: 0.72rem; font-weight: 600; padding: 2px 10px; border-radius: 9999px; }
    .upsell { font-size: 0.9rem; color: #4b5563; margin: 1rem 0 0.75rem; }
    .cta { display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 0.6rem 1.1rem; border-radius: 8px; font-weight: 600; }
  `],
})
export class VerifierDisponibiliteMarqueComponent {
  private readonly reports = inject(BrandReportService);

  readonly query = signal('');
  readonly loading = signal(false);
  readonly report = signal<BrandReport | null>(null);
  readonly error = signal<string | null>(null);
  readonly cost = BRAND_REPORT_COST;

  // Rapport de marque pour un nom saisi — nécessite un compte + crédits.
  private keycloak?: KeycloakService;
  readonly isLoggedIn = signal(false);
  readonly fullLoading = signal(false);
  readonly fullReport = signal<BrandReport | null>(null);
  readonly fullError = signal<string | null>(null);

  constructor() {
    applyContentSeo({
      title: 'Vérifier la disponibilité d’un nom de marque',
      description:
        'Vérifiez si un nom de marque est disponible : domaine, réseaux sociaux et marque déposée (INPI + EUIPO). Aperçu gratuit et rapport de marque.',
      path: '/verifier-disponibilite-nom-de-marque',
    });
    // Uniquement côté navigateur : au prerender, Keycloak n'est pas initialisé.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.keycloak = inject(KeycloakService);
      try { this.isLoggedIn.set(this.keycloak.isLoggedIn()); } catch { this.isLoggedIn.set(false); }
    }
  }

  /** Génère le Rapport de marque pour le nom saisi. */
  getFullReport(): void {
    const name = this.query().trim();
    if (!name || this.fullLoading()) return;
    // Non connecté : rediriger vers la connexion puis revenir sur cette page.
    if (!this.isLoggedIn()) {
      this.keycloak?.login({ redirectUri: typeof window !== 'undefined' ? window.location.href : undefined });
      return;
    }
    this.fullLoading.set(true);
    this.fullError.set(null);
    this.fullReport.set(null);
    this.reports.full(name).pipe(timeout(90000)).subscribe({
      next: (r) => { this.fullReport.set(r); this.fullLoading.set(false); },
      error: (err) => {
        this.fullError.set(
          err?.status === 403
            ? `Crédits insuffisants (${this.cost} crédits requis). Rechargez votre solde pour générer le rapport de marque.`
            : 'La génération du rapport a échoué. Réessayez dans un instant.',
        );
        this.fullLoading.set(false);
      },
    });
  }

  check(): void {
    const name = this.query().trim();
    if (!name || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.report.set(null);
    this.reports.preview(name).subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('La vérification a échoué. Réessayez dans un instant.');
        this.loading.set(false);
      },
    });
  }

  label(s: Availability): string {
    return s === 'free' ? 'Libre' : s === 'taken' ? 'Pris' : '?';
  }

  color(s: Availability): string {
    return s === 'free' ? '#16a34a' : s === 'taken' ? '#dc2626' : '#9ca3af';
  }
}
