import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { KeycloakService } from 'keycloak-angular';
import { DomainService } from '../../services/domain';
import { BrandReportViewComponent } from '../brand-report/brand-report-view';
import { BrandReportLockedComponent } from '../brand-report/brand-report-locked';
import { BRAND_REPORT_COST, ReportLike, Availability } from '../../services/brand-report';
import { SAMPLE_REPORT } from '../brand-report/sample-report';
import { AnalyticsService } from '../../services/analytics';

/**
 * Rapport PUBLIC d'un nom — `/report?name=…`, sans compte.
 *
 * Le chemin de qui arrive avec une idée. Il obtient tout de suite ce qui ne
 * coûte rien à produire : la disponibilité du nom sur les quatre extensions
 * les plus courantes. Le reste — marques déposées, réseaux sociaux — reste
 * derrière l'inscription, et le dit franchement.
 *
 * Pourquoi une page publique plutôt qu'une redirection vers la connexion :
 * envoyer quelqu'un s'inscrire pour savoir si « kalvira.com » est libre, c'est
 * lui demander de payer d'avance une réponse qu'on peut lui donner
 * gratuitement en deux secondes. On répond d'abord ; on demande ensuite, quand
 * il a vu ce que vaut la réponse et qu'il veut la suite.
 *
 * Aucune analyse du nom ici : elle suppose une suggestion enregistrée, donc un
 * projet, donc un compte. Une page publique ne doit rien promettre qu'elle ne
 * puisse tenir sans identité.
 */
@Component({
  selector: 'app-rapport-public',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, BrandReportViewComponent, BrandReportLockedComponent],
  template: `
    <div class="rp">
      <form class="rp-form" (submit)="verifier($event)">
        <label class="sr-only" for="rp-nom">{{ 'PUBLIC_REPORT.PLACEHOLDER' | translate }}</label>
        <input id="rp-nom" name="nom" type="text" autocomplete="off"
               [value]="nom()" [placeholder]="'PUBLIC_REPORT.PLACEHOLDER' | translate">
        <button type="submit" class="nm-btn-primary">{{ 'PUBLIC_REPORT.CHECK' | translate }}</button>
      </form>

      @if (exemple()) {
        <!-- Exemple COMPLET, verdicts compris : c'est le seul moyen de montrer
             ce qu'on achète sans le donner. Le bandeau dit franchement que ce
             n'est pas le nom du visiteur — un exemple pris pour un résultat
             est pire qu'aucun exemple. -->
        <p class="rp-sample">{{ 'PUBLIC_REPORT.SAMPLE_BANNER' | translate }}</p>
        <app-brand-report-view [report]="echantillon"></app-brand-report-view>
        <section class="rp-more">
          <h2 class="rp-more__title">{{ 'PUBLIC_REPORT.SAMPLE_TITLE' | translate }}</h2>
          <p class="rp-more__lead">{{ 'PUBLIC_REPORT.SAMPLE_LEAD' | translate }}</p>
          <button type="button" class="nm-btn-primary" (click)="quitterExemple()">
            {{ 'PUBLIC_REPORT.SAMPLE_CTA' | translate }}
          </button>
        </section>
      } @else if (chargement()) {
        <p class="rp-state">{{ 'PUBLIC_REPORT.LOADING' | translate }}</p>
      } @else if (erreur()) {
        <p class="rp-state rp-state--ko">{{ 'PUBLIC_REPORT.ERROR' | translate }}</p>
      } @else if (rapport(); as r) {
        <app-brand-report-view [report]="r" [locked]="true">
          <!-- Le palier payant, en version « pas encore inscrit » : le prix en
               crédits ne dit rien à qui n'a pas de solde. Ce qu'il veut savoir,
               c'est ce qu'il obtient en créant un compte. -->
          <app-brand-report-locked locked
            [embedded]="true"
            [signup]="!connecte()"
            [name]="r.name"
            [priceCredits]="cout"
            [freeExtensions]="extensionsLibres()"
            (unlock)="deverrouiller()"
            (topUp)="deverrouiller()">
          </app-brand-report-locked>
        </app-brand-report-view>

        <!-- L'autre suite possible : ce nom ne convient pas, ou il est pris.
             Générer des noms suppose de savoir ce qu'on nomme — donc une
             description, donc un projet. On le dit, plutôt que de proposer un
             bouton qui produirait n'importe quoi. -->
        <section class="rp-more">
          <h2 class="rp-more__title">{{ 'PUBLIC_REPORT.MORE_TITLE' | translate }}</h2>
          <p class="rp-more__lead">{{ 'PUBLIC_REPORT.MORE_LEAD' | translate }}</p>
          <button type="button" class="nm-btn-primary" (click)="creerProjet()">
            {{ 'PUBLIC_REPORT.MORE_CTA' | translate }}
          </button>
        </section>
      }
    </div>
  `,
  styleUrl: './rapport-public.css',
})
export class RapportPublicComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly domains = inject(DomainService);
  private keycloak?: KeycloakService;

  /**
   * Déjà connecté : le compte existe, l'offre d'inscription n'a plus d'objet.
   *
   * Lu côté navigateur seulement — au prérendu, Keycloak n'est pas initialisé
   * et toute lecture d'état y serait au mieux fausse.
   */
  readonly connecte = signal(false);
  private readonly translate = inject(TranslateService);
  private readonly analytics = inject(AnalyticsService);

  /** Les quatre extensions que tout le monde regarde en premier. */
  private readonly EXTENSIONS = ['.com', '.fr', '.net', '.org'];

  readonly cout = BRAND_REPORT_COST;
  /** `?exemple=1` : le rapport de démonstration, complet et gratuit. */
  readonly exemple = signal(false);
  readonly echantillon = SAMPLE_REPORT;
  readonly nom = signal('');
  readonly rapport = signal<ReportLike | null>(null);
  readonly chargement = signal(false);
  readonly erreur = signal(false);

  constructor() {
    // ⚠ `inject()` n'est utilisable qu'au MOMENT DE LA CONSTRUCTION. Placé dans
    // `ngOnInit`, il lève NG0203 et interrompt tout le crochet — la page
    // affichait alors son formulaire sans jamais lancer la vérification.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.keycloak = inject(KeycloakService);
      try { this.connecte.set(this.keycloak.isLoggedIn()); } catch { this.connecte.set(false); }
    }
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('exemple') === '1') {
      this.exemple.set(true);
      this.analytics.track('public_report_sample_viewed');
      return;
    }
    const demande = (this.route.snapshot.queryParamMap.get('name') ?? '').trim();
    if (demande) this.lancer(demande);
  }

  verifier(event: Event): void {
    event.preventDefault();
    const champ = (event.target as HTMLFormElement).elements.namedItem('nom') as HTMLInputElement | null;
    const saisi = (champ?.value ?? '').trim();
    if (!saisi) return;
    // L'URL porte le nom : la page se partage et se recharge telle quelle.
    void this.router.navigate([], { relativeTo: this.route, queryParams: { name: saisi } });
    this.lancer(saisi);
  }

  private lancer(saisi: string): void {
    const propre = saisi.toLowerCase().replace(/^\./, '').replace(/\.[a-z]{2,10}$/, '');
    if (!propre) return;
    this.nom.set(propre);
    this.chargement.set(true);
    this.erreur.set(false);
    this.rapport.set(null);
    this.analytics.track('public_report_requested');

    this.domains.recheckDomains([propre], this.EXTENSIONS).subscribe({
      next: (res: any) => {
        const trouve = (res?.domains ?? [])[0];
        this.rapport.set({
          name: propre,
          handle: propre.replace(/[^a-z0-9]/g, ''),
          domains: this.EXTENSIONS.map((ext) => {
            const etat = trouve?.allExtensions?.[ext];
            return {
              extension: ext.replace(/^\./, ''),
              domain: propre + ext,
              status: (etat === true ? 'free' : etat === false ? 'taken' : 'unknown') as Availability,
            };
          }),
        });
        this.chargement.set(false);
        // Combien de noms ressortent entièrement libres : c'est le signal qui
        // dit si le produit répond à ce que les visiteurs viennent chercher.
        this.analytics.track('public_report_shown', {
          libres: this.rapport()?.domains.filter((d) => d.status === 'free').length ?? 0,
        });
      },
      error: () => {
        this.analytics.track('public_report_failed');
        this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }

  /** Quitter l'exemple pour son propre nom : le champ reste en haut de page. */
  quitterExemple(): void {
    this.exemple.set(false);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  extensionsLibres(): string[] {
    return (this.rapport()?.domains ?? []).filter((d) => d.status === 'free').map((d) => '.' + d.extension);
  }

  /**
   * Débloquer marques et réseaux.
   *
   * Le geste est le même dans les deux cas — on part vers l'application avec
   * le nom — mais ce qu'on y trouve diffère : une inscription pour qui n'a pas
   * de compte, la popup de vérification pour qui en a un. Le libellé et le
   * pied de bloc suivent, sinon un utilisateur connecté se voit proposer de
   * créer le compte qu'il possède déjà.
   */
  deverrouiller(): void {
    this.analytics.track(this.connecte() ? 'public_report_verify_clicked' : 'public_report_signup_clicked');
    this.allerVersApp(true);
  }

  creerProjet(): void {
    this.analytics.track('public_report_project_clicked');
    this.allerVersApp(false);
  }

  private allerVersApp(verifier: boolean): void {
    // Le nom voyage dans l'URL : le wizard le reprend après la connexion, crée
    // le projet et rejoue le contrôle. Rien à ressaisir.
    void this.router.navigate(['/app'], {
      queryParams: { nom: this.nom(), ...(verifier ? { verifier: 1 } : {}) },
    });
  }
}
