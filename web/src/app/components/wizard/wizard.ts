import { Component, signal, computed, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Subscription, firstValueFrom, of, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DomainService, CompetitorDomain } from '../../services/domain';
import { BrandReportService, BrandReport, Availability, NameQuality, BRAND_REPORT_COST } from '../../services/brand-report';
import { KeycloakService } from 'keycloak-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { Steps } from 'primeng/steps';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { InputText } from 'primeng/inputtext';
import { Chip } from 'primeng/chip';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { SelectButton } from 'primeng/selectbutton';
import { Select } from 'primeng/select';
import { Drawer } from 'primeng/drawer';
import { Tooltip } from 'primeng/tooltip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { SplitButton } from 'primeng/splitbutton';
import { Toast } from 'primeng/toast';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { UserService } from '../../services/user';
import { ProjectService } from '../../services/project';
import { FeedbackService } from '../../services/feedback';
import { AnalyticsService } from '../../services/analytics';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ResultsGridComponent } from '../results/results-grid';
import type { BrandReportSummary } from '../../services/brand-report';
import { BrandReportLockedComponent } from '../brand-report/brand-report-locked';
import { BrandReportViewComponent } from '../brand-report/brand-report-view';

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Steps,
    Card,
    Button,
    Textarea,
    InputText,
    Chip,
    ProgressSpinner,
    TableModule,
    SelectButton,
    Select,
    Drawer,
    Tooltip,
    ConfirmDialog,
    Dialog,
    SplitButton,
    Toast,
    TranslatePipe,
    ResultsGridComponent,
    BrandReportLockedComponent,
    BrandReportViewComponent
  ],
  templateUrl: './wizard.html',
  styleUrl: './wizard.css'
})
export class WizardComponent implements OnInit, OnDestroy {
  items: MenuItem[] = [];


  // ─── US-001 : International / Local ───────────────────────
  isLocal = signal(false);
  localeOverride = signal<string>('');

  // ─── US-032 : Naming styles (local mode only) ─────────────
  descriptiveNames = signal(false);
  culturalNames = signal(false);
  // ────────────────────────────────────────────────────────────

  // ─── #1 : Longueur minimale des noms générés ──────────────
  /** En dessous de 5 caractères, quasiment tout est déjà déposé. */
  readonly MIN_LENGTH_FLOOR = 5;
  readonly DEFAULT_MIN_LENGTH = 7;
  readonly MAX_LENGTH_SETTING = 7;
  readonly MIN_LENGTH_OPTIONS = [5, 6, 7].map(v => ({ label: `≥ ${v}`, value: v }));

  /**
   * Part des .com déjà déposés, par longueur de nom.
   *
   * Mesuré le 01/08/2026 sur 340 noms prononçables tirés au sort (motifs CVCVC,
   * CVCVCV, CVCCVC…), vérifiés par notre propre Whois :
   *   5 caractères → 83 % pris (IC 95 % : 76–90, n=120)
   *   6 caractères → 34 % pris (IC 95 % : 28–40, n=220)
   *   7 caractères →  2,5 % pris (n=120)
   * Les chiffres publiés en ligne (« 70 % des 5 lettres sont libres ») comptent
   * toutes les combinaisons, y compris imprononçables — sans intérêt ici.
   *
   * On affiche la borne basse de l'intervalle, arrondie : le message reste vrai
   * même dans l'hypothèse la plus défavorable à notre mesure.
   */
  readonly TAKEN_RATE: Record<number, number> = { 5: 75, 6: 25 };

  /** Part de .com déjà pris à afficher pour la longueur choisie (0 si non pertinent). */
  takenRate = computed(() => this.TAKEN_RATE[this.minNameLength()] ?? 0);
  minNameLength = signal(this.DEFAULT_MIN_LENGTH);
  /** L'utilisateur a réglé la longueur à la main → l'extraction IA ne l'écrase plus. */
  private minLengthTouched = signal(false);
  /** Longueur déduite de la description libre (affichée comme « détecté »). */
  minLengthFromBrief = signal<number | null>(null);
  /** Autres contraintes devinées du brief, affichées pour transparence. */
  briefAvoidWords = signal<string[]>([]);
  briefReferenceBrands = signal<string[]>([]);

  /** Vrai dès que la longueur demandée passe sous le seuil « raisonnable ». */
  isRiskyLength = computed(() => this.minNameLength() < this.DEFAULT_MIN_LENGTH);
  /** Longueur proposée quand on assouplit la contrainte après un échec. */
  relaxedLength = computed(() => Math.min(this.minNameLength() + 2, this.MAX_LENGTH_SETTING));

  onMinLengthChange(value: number) {
    this.minNameLength.set(value);
    this.minLengthTouched.set(true);
  }

  // ─── #3 : Exemples de noms aimés / rejetés (saisie libre, étape réglages) ──
  likedExamplesInput = signal('');
  dislikedExamplesInput = signal('');

  /** Normalise une saisie libre « qonto.com, notion.so » en liste de noms. */
  private parseExamples(raw: string): string[] {
    return [...new Set(
      raw
        .split(/[\s,;]+/)
        .map(t => t.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''))
        .filter(t => t.length > 1)
        .map(t => t.slice(0, 60))
    )];
  }

  /** Noms aimés saisis à la main par l'utilisateur. */
  manualLikedExamples = computed(() => this.parseExamples(this.likedExamplesInput()));
  /** Noms rejetés saisis à la main par l'utilisateur. */
  manualDislikedExamples = computed(() => this.parseExamples(this.dislikedExamplesInput()));

  // ─── #4 : Produits existants du même secteur ──────────────
  competitors = signal<CompetitorDomain[]>([]);
  /** 'web' = liste issue d'une recherche web en direct, 'model' = connaissance du modèle. */
  competitorsSource = signal<'web' | 'model'>('model');
  competitorsLoading = signal(false);
  private competitorsLoaded = signal(false);
  showCompetitors = signal(true);

  /**
   * L'avis sur un domaine du marché n'est pas stocké à part : il se lit dans les
   * listes d'exemples, qui restent la seule source de vérité. Noter une ligne
   * revient donc à l'ajouter ou la retirer de la liste correspondante, et une
   * retouche à la main dans le champ texte éteint le pouce en conséquence.
   */
  competitorRating(domain: string): 'liked' | 'disliked' | 'neutral' {
    if (this.manualLikedExamples().includes(domain)) return 'liked';
    if (this.manualDislikedExamples().includes(domain)) return 'disliked';
    return 'neutral';
  }

  setCompetitorRating(domain: string, rating: 'liked' | 'disliked') {
    const next = this.competitorRating(domain) === rating ? 'neutral' : rating;
    this.likedExamplesInput.update(v => this.toggleInList(v, domain, next === 'liked'));
    this.dislikedExamplesInput.update(v => this.toggleInList(v, domain, next === 'disliked'));
  }

  /** Ajoute ou retire un nom d'une saisie libre « a.com, b.com », sans doublon. */
  private toggleInList(raw: string, domain: string, present: boolean): string {
    const items = this.parseExamples(raw).filter(item => item !== domain);
    if (present) items.push(domain);
    return items.join(', ');
  }

  /** Domaines du marché ni aimés ni rejetés : simple contexte dont il faut se démarquer. */
  neutralCompetitorDomains = computed(() => {
    const liked = new Set(this.manualLikedExamples());
    const disliked = new Set(this.manualDislikedExamples());
    return this.competitors()
      .map(c => c.domain)
      .filter(d => !liked.has(d) && !disliked.has(d));
  });

  /** Références de style envoyées à l'IA (marché aimé + saisie libre confondus). */
  styleReferences = computed(() => this.manualLikedExamples().slice(0, 10));

  /** Styles rejetés envoyés à l'IA. */
  rejectedStyleReferences = computed(() => this.manualDislikedExamples().slice(0, 12));

  // ─── #2 : Aide quand la recherche ne trouve rien ──────────
  showNoResultHelp = signal(false);
  // ────────────────────────────────────────────────────────────

  private readonly EXT_TO_LOCALE: Record<string, string> = {
    '.fr': 'fr', '.be': 'fr', '.ch': 'fr',
    '.de': 'de', '.at': 'de',
    '.es': 'es', '.mx': 'es', '.ar': 'es', '.co': 'es',
    '.it': 'it',
    '.nl': 'nl',
    '.pt': 'pt', '.br': 'pt',
    '.pl': 'pl',
    '.se': 'sv',
    '.dk': 'da',
    '.fi': 'fi',
    '.no': 'no',
    '.ro': 'ro',
    '.cz': 'cs',
    '.hu': 'hu',
    '.tr': 'tr',
    '.jp': 'ja',
    '.cn': 'zh',
    '.ru': 'ru',
    '.uk': 'en', '.gb': 'en', '.au': 'en', '.us': 'en', '.ca': 'en', '.nz': 'en',
  };

  // Détection géo (US-XXX) : pays (code région ISO) → extension locale proposée.
  // On ne mappe que des ccTLD présents dans EXT_TO_LOCALE pour que la locale se
  // résolve. Les marchés où le .com domine (US…) retombent sur le défaut .com.
  private readonly COUNTRY_TO_EXT: Record<string, string> = {
    FR: '.fr', BE: '.be', CH: '.ch', LU: '.fr',
    DE: '.de', AT: '.at',
    ES: '.es', MX: '.mx', AR: '.ar', CO: '.co',
    IT: '.it',
    NL: '.nl',
    PT: '.pt', BR: '.br',
    PL: '.pl',
    SE: '.se', DK: '.dk', FI: '.fi', NO: '.no',
    RO: '.ro', CZ: '.cz', HU: '.hu', TR: '.tr',
    JP: '.jp', CN: '.cn', RU: '.ru',
    GB: '.uk', AU: '.au', CA: '.ca', NZ: '.nz',
  };

  // Repli quand la locale navigateur n'a pas de région (ex. « fr » sans pays) :
  // langue → ccTLD du marché principal. L'anglais retombe sur le défaut .com.
  private readonly LANG_TO_EXT: Record<string, string> = {
    fr: '.fr', de: '.de', es: '.es', it: '.it', nl: '.nl', pt: '.pt',
    pl: '.pl', sv: '.se', da: '.dk', fi: '.fi', no: '.no', ro: '.ro',
    cs: '.cz', hu: '.hu', tr: '.tr', ja: '.jp', zh: '.cn', ru: '.ru',
  };

  readonly LOCALE_LABELS: Record<string, string> = {
    cs: 'Čeština',
    da: 'Dansk',
    de: 'Deutsch',
    en: 'English',
    es: 'Español',
    fi: 'Suomi',
    fr: 'Français',
    hu: 'Magyar',
    it: 'Italiano',
    nl: 'Nederlands',
    no: 'Norsk',
    pl: 'Polski',
    pt: 'Português',
    ro: 'Română',
    sv: 'Svenska',
    tr: 'Türkçe',
    ja: '日本語',
    zh: '中文',
    ru: 'Русский',
  };

  readonly LOCALE_OPTIONS = Object.entries(this.LOCALE_LABELS).map(([value, label]) => ({ value, label }));

  detectedLocale = computed(() => {
    for (const ext of this.selectedExtensions()) {
      const code = this.EXT_TO_LOCALE[ext];
      if (code) return code;
    }
    return null;
  });

  effectiveLocale = computed(() => {
    if (!this.isLocal()) return null;
    return this.localeOverride() || this.detectedLocale() || null;
  });

  /**
   * Déduit l'extension de domaine locale à partir de la locale du navigateur.
   * Sûr côté serveur (le wizard est rendu client, mais on garde le garde-fou).
   * Renvoie null hors zone reconnue → on garde le défaut international .com.
   */
  private detectRegionalExtension(): string | null {
    if (typeof navigator === 'undefined') return null;
    const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
    // 1) région explicite dans la locale (ex. « fr-FR » → FR → .fr)
    for (const loc of locales) {
      const region = loc?.split('-')[1]?.toUpperCase();
      if (region && this.COUNTRY_TO_EXT[region]) return this.COUNTRY_TO_EXT[region];
    }
    // 2) repli sur la langue seule (ex. « fr » → .fr)
    for (const loc of locales) {
      const langCode = loc?.split('-')[0]?.toLowerCase();
      if (langCode && this.LANG_TO_EXT[langCode]) return this.LANG_TO_EXT[langCode];
    }
    return null;
  }

  /**
   * Applique les défauts régionaux selon la localisation détectée : extension
   * locale proposée (+ .com), mode local activé et options régionales/culturelles
   * de génération activées. Hors zone reconnue, on reste sur le défaut .com / intl.
   */
  private applyRegionalDefaults(): void {
    const ext = this.detectRegionalExtension();
    if (!ext || ext === '.com') {
      this.selectedExtensions.set(['.com']);
      this.isLocal.set(false);
      this.descriptiveNames.set(false);
      this.culturalNames.set(false);
      return;
    }
    this.selectedExtensions.set([ext, '.com']);
    this.isLocal.set(true);
    this.descriptiveNames.set(true);
    this.culturalNames.set(true);
  }
  // ────────────────────────────────────────────────────────────

  landingBenefits = [
    { icon: 'pi pi-sparkles',   titleKey: 'LANDING.B1_TITLE', descKey: 'LANDING.B1_DESC' },
    { icon: 'pi pi-check-circle', titleKey: 'LANDING.B2_TITLE', descKey: 'LANDING.B2_DESC' },
    { icon: 'pi pi-heart',      titleKey: 'LANDING.B3_TITLE', descKey: 'LANDING.B3_DESC' },
    { icon: 'pi pi-globe',      titleKey: 'LANDING.B4_TITLE', descKey: 'LANDING.B4_DESC' },
  ];

  activeIndex = signal(0);
  maxActiveIndex = signal(0);
  loading = signal(false);
  /** Clé i18n du message de l'overlay de chargement, selon l'étape en cours. */
  loadingKey = signal('WIZARD.LOADING');
  isLoggedIn = signal(false);
  showLanding = signal(false);

  // Projets
  projectId = signal<string | null>(null);
  projectName = signal('');
  isEditingName = signal(false);

  // Étape 1
  description = signal('');
  refinedDescription = signal('');

  // Étape 2
  keywords = signal<string[]>([]);
  newKeyword = signal('');
  /**
   * Doit rester aligné sur `@ArrayMaxSize(50)` de SearchDomainsDto : au-delà,
   * l'API rejette la recherche par un 400 que rien n'explique à l'écran.
   * L'IA peut renvoyer plus de 50 mots-clés, et l'utilisateur peut en ajouter :
   * toute affectation passe donc par `setKeywords`.
   */
  readonly MAX_KEYWORDS = 50;
  keywordsFull = computed(() => this.keywords().length >= this.MAX_KEYWORDS);

  newExtension = signal('');
  selectedExtensions = signal<string[]>(['.com']);
  /**
   * « Au moins une extension disponible » par défaut, comme côté API.
   *
   * Exiger toutes les extensions est un choix légitime, mais c'est une
   * contrainte forte : elle doit venir de l'utilisateur. Les visiteurs hors
   * zone .com démarrent déjà avec deux extensions (cf. applyRegionalDefaults),
   * et se voyaient donc imposer « libre sur .fr ET sur .com » sans l'avoir
   * demandé — d'où des recherches longues et souvent bredouilles.
   */
  matchMode = signal('any');
  matchOptions = signal<any[]>([]);

  // Étape 3
  domains = signal<any[]>([]);
  totalChecked = signal(0);
  recheckLoading = signal(false);
  copiedDomain = signal<string | null>(null);
  newDomainName = signal('');
  addingDomain = signal(false);
  expandedAnalysisId = signal<string | null>(null);
  showPickDialog = signal(false);
  pickBestLoading = signal(false);
  pickBestResult = signal<{ recommended: string; reason: string } | null>(null);
  pickBestCandidates = signal<string[]>([]);
  private pickBestKey = signal<string | null>(null);
  showDisliked = signal(false);
  likedDomains = computed(() => this.domains().filter(d => d.rating === 'liked'));

  pickMenuItems = computed<MenuItem[]>(() => [
    {
      label: this.translate.instant('WIZARD.STEP3.PICK_ALL'),
      icon: 'pi pi-list',
      command: () => this.helpMePick('all'),
    },
    {
      label: this.translate.instant('WIZARD.STEP3.PICK_FAVOURITES'),
      icon: 'pi pi-thumbs-up',
      disabled: this.likedDomains().length < 2,
      command: () => this.helpMePick('favourites'),
    },
  ]);
  streamProgress = signal<{ phase: 'generating' | 'checking'; name?: string; checked: number; found: number } | null>(null);

  // ─── US-022 : Buy on registrar ────────────────────
  readonly REGISTRARS = [
    {
      label: 'OVH',
      url: (n: string, exts: string[]) => {
        const d = exts.length === 1 ? `${n}${exts[0]}` : n;
        return `https://www.ovhcloud.com/fr/domains/domain-name-checker/?q=${d}&utm_source=namorama&utm_medium=referral&utm_campaign=domain_search`;
      },
    },
    {
      label: 'Namecheap',
      url: (n: string, exts: string[]) => {
        const d = exts.length === 1 ? `${n}${exts[0]}` : n;
        return `https://www.namecheap.com/domains/registration/results.aspx?domain=${d}&utm_source=namorama&utm_medium=referral&utm_campaign=domain_search`;
      },
    },
    {
      label: 'GoDaddy',
      url: (n: string, exts: string[]) => {
        const d = exts.length === 1 ? `${n}${exts[0]}` : n;
        return `https://www.godaddy.com/domainsearch/find?domainToCheck=${d}&utm_source=namorama&utm_medium=referral&utm_campaign=domain_search`;
      },
    },
    {
      label: 'Gandi',
      url: (n: string, exts: string[]) => {
        const d = exts.length === 1 ? `${n}${exts[0]}` : n;
        return `https://shop.gandi.net/fr/domain/suggest?search=${d}&utm_source=namorama&utm_medium=referral&utm_campaign=domain_search`;
      },
    },
    {
      label: 'Hostinger',
      url: (n: string, exts: string[]) => {
        const d = exts.length === 1 ? `${n}${exts[0]}` : n;
        return `https://www.hostinger.com/fr/nom-de-domaine-disponible?domain=${d}&utm_source=namorama&utm_medium=referral&utm_campaign=domain_search`;
      },
    },
  ];

  /** Lien vers la recherche de marque INPI (base Marques) pour un nom donné. */
  inpiUrl(name: string): string {
    return `https://data.inpi.fr/search?q=${encodeURIComponent(name)}&type=brands`;
  }

  // ─── Rapport de disponibilité de marque (US-054) ───────────────────────────
  // Remplace les anciens liens profonds registrar/INPI/réseaux (qui laissaient
  // l'utilisateur faire le travail à la main) par un rapport réel et payant.
  readonly brandReportCost = BRAND_REPORT_COST;
  readonly brandReport = signal<BrandReport | null>(null);
  readonly brandReportLoading = signal(false);
  readonly brandReportError = signal<string | null>(null);
  readonly showReportDialog = signal(false);
  readonly brandReportName = signal('');
  // Écran de confirmation avant génération : crédits + destinataires email.
  readonly showReportConfirm = signal(false);
  readonly reportEmails = signal('');
  readonly userEmail = signal('');

  /** Point d'entrée : si le rapport existe déjà, on l'ouvre (sans débit) ; sinon on demande confirmation. */
  /**
   * « rapport de marque » depuis une carte : ouvre le rapport s'il est acquis,
   * sinon le rapport VERROUILLÉ — pas la popup d'achat. Le handoff distingue
   * les deux gestes : vérifier (popup courte) et consulter le rapport (écran
   * qui montre ce qu'on achète).
   */
  /**
   * Le rapport a une URL : `?rapport=<nom>` sur la route courante.
   *
   * Il s'affiche dans un dialogue plein écran, mais c'est un ÉCRAN, pas une
   * incise : on y reste, on le lit, on le partage. Sans entrée d'historique,
   * « page précédente » quittait la recherche entière au lieu de revenir aux
   * résultats, et l'écran n'était pas adressable.
   *
   * L'URL est la source de vérité de ce qui est à l'écran : `showReportDialog`
   * ne se lève et ne retombe que par elle (voir `ngOnInit`).
   */
  private static readonly REPORT_PARAM = 'rapport';

  /** Valeur du paramètre pour le rapport d'exemple, qui n'a pas de nom réel. */
  private static readonly SAMPLE_PARAM = 'exemple';

  /** Vrai si c'est nous qui avons empilé l'entrée d'historique du rapport. */
  private reportUrlPushed = false;

  /**
   * Nom dont les données sont DÉJÀ chargées, en attente de l'URL.
   *
   * Sans lui, l'écouteur d'URL rechargerait ce que l'appelant vient d'obtenir :
   * une requête pour rien après chaque génération.
   */
  private preloadedReportName: string | null = null;

  /** Affiche un rapport dont les données sont déjà en mémoire. */
  private showReport(name: string): void {
    this.preloadedReportName = name;
    this.pushReportUrl(name);
  }

  private pushReportUrl(name: string): void {
    this.reportUrlPushed = true;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [WizardComponent.REPORT_PARAM]: name },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Ferme le rapport.
   *
   * Si l'entrée d'historique vient de nous, on la dépile — sinon « page
   * précédente » rouvrirait le rapport qu'on vient de fermer. Sur une arrivée
   * directe par l'URL il n'y a rien à dépiler : on retire le paramètre en
   * remplaçant l'entrée, pour ne pas sortir du site.
   */
  closeReport(): void {
    if (this.reportUrlPushed) {
      this.reportUrlPushed = false;
      this.location.back();
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [WizardComponent.REPORT_PARAM]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Le dialogue s'est fermé autrement que par le bouton (Échap) : suivre l'URL. */
  onReportVisibleChange(visible: boolean): void {
    if (visible) return;
    if (this.route.snapshot.queryParamMap.get(WizardComponent.REPORT_PARAM)) {
      this.closeReport();
    } else {
      this.showReportDialog.set(false);
    }
  }

  /** Applique l'URL : ouvrir le rapport demandé, ou refermer s'il n'y en a plus. */
  private syncReportFromUrl(param: string | null): void {
    if (!param) {
      this.reportUrlPushed = false;
      this.preloadedReportName = null;
      this.showReportDialog.set(false);
      return;
    }
    if (param === WizardComponent.SAMPLE_PARAM) {
      this.loadSampleReport();
      this.showReportDialog.set(true);
      return;
    }
    if (this.preloadedReportName && this.normName(this.preloadedReportName) === this.normName(param)) {
      this.preloadedReportName = null;
      this.showReportDialog.set(true);
      return;
    }
    if (this.showReportDialog() && this.normName(this.brandReportName()) === this.normName(param)) return;
    this.loadReportInto(param);
  }

  /** Charge le rapport d'un nom et l'affiche — chemin de l'arrivée par l'URL. */
  private loadReportInto(name: string): void {
    this.brandReportName.set(name);
    this.brandReportError.set(null);
    this.isSampleReport.set(false);
    this.forceRegen.set(false);
    this.brandReport.set(null);
    void this.loadReportOffer(name);
    this.brandReportService.existing(name).subscribe({
      next: (res) => {
        if (res?.exists && res.report) {
          this.markReported(name);
          this.brandReport.set(res.report);
        }
        this.showReportDialog.set(true);
      },
      error: () => this.showReportDialog.set(true),
    });
  }

  openFullReport(name: string): void {
    this.pushReportUrl(name);
  }

  /** Charge l'offre du serveur pour ce nom (prix, droit gratuit, solde). */
  private loadReportOffer(name: string): void {
    this.reportOffer.set(null);
    this.brandReportService.offer(name).subscribe({
      next: (o) => this.reportOffer.set({
        freeThisMonth: o.deepReport.freeThisMonth,
        priceCredits: o.deepReport.priceCredits,
        credits: o.account.credits,
      }),
      error: () => this.reportOffer.set(null),
    });
  }

  askBrandReport(name: string): void {
    this.brandReportName.set(name);
    this.brandReportError.set(null);
    this.brandReport.set(null);
    this.isSampleReport.set(false);
    this.forceRegen.set(false);
    this.brandReportService.existing(name).subscribe({
      next: (res) => {
        if (res?.exists && res.report) {
          this.markReported(name);
          this.brandReport.set(res.report);
          this.showReport(name);
        } else {
          this.openReportConfirm();
        }
      },
      error: () => this.openReportConfirm(),
    });
  }

  /**
   * Offre du serveur pour le nom courant : acheté, prix, droit gratuit, solde.
   * Chargée à chaque ouverture de la confirmation — le droit au rapport offert
   * peut avoir été consommé dans un autre onglet, ou le mois avoir changé.
   * `null` tant que la réponse n'est pas arrivée : la carte affiche alors le
   * tarif plein, jamais une gratuité qu'on ne sait pas encore confirmer.
   */
  readonly reportOffer = signal<{ freeThisMonth: boolean; priceCredits: number; credits: number } | null>(null);

  /** Le rapport est-il offert pour ce nom, d'après le serveur ? */
  reportIsFree(): boolean {
    return this.reportOffer()?.freeThisMonth === true;
  }

  /** Ouvre la confirmation (coût, solde, destinataires) après avoir chargé l'email du compte. */
  private async openReportConfirm(): Promise<void> {
    // Offre indisponible : on reste sur le tarif plein, c'est le défaut sûr.
    this.loadReportOffer(this.brandReportName());
    if (!this.userEmail()) {
      try {
        const profile: any = await this.keycloak.loadUserProfile();
        this.userEmail.set(profile?.email ?? '');
      } catch { /* profil indisponible : champ email vide, l'utilisateur saisit */ }
    }
    this.reportEmails.set(this.userEmail());
    this.showReportConfirm.set(true);
  }

  /**
   * Peut-on lancer le rapport : droit gratuit disponible, OU solde suffisant.
   * La décision définitive reste au serveur, sous verrou ; ceci ne sert qu'à
   * ne pas proposer un bouton qui échouera.
   */
  hasEnoughReportCredits(): boolean {
    return this.reportIsFree() || this.userService.creditsValue >= this.brandReportCost;
  }

  /** Renvoie vers l'achat de crédits (dialogue existant). */
  openCreditPurchase(): void {
    this.showReportConfirm.set(false);
    this.projectService.showCreditDialog.set(true);
  }

  /** Régénérer un rapport en cache (redébite) : repasse par la confirmation. */
  readonly forceRegen = signal(false);

  /** Étape 2 : confirme, ouvre le rapport plein écran, débite et génère. */
  confirmBrandReport(): void {
    if (!this.hasEnoughReportCredits()) { this.openCreditPurchase(); return; }
    // Quand 50 crédits sont réellement débités — la moitié de la réserve
    // mensuelle en un clic — on demande une confirmation explicite. Quand le
    // rapport est offert, aucune : la friction n'y a aucune valeur.
    if (!this.reportIsFree() && !this.forceRegen()) {
      this.confirmationService.confirm({
        header: this.translate.instant('WIZARD.STEP3.REPORT_CONFIRM_TITLE'),
        message: this.translate.instant('WIZARD.STEP3.REPORT_DEBIT_CONFIRM', { n: this.brandReportCost }),
        acceptLabel: this.translate.instant('WIZARD.STEP3.REPORT_CONFIRM_BTN'),
        rejectLabel: this.translate.instant('COMMON.CANCEL'),
        accept: () => this.launchBrandReport(),
      });
      return;
    }
    this.launchBrandReport();
  }

  private launchBrandReport(): void {
    // Vérifier vaut approbation : dépenser des crédits sur un nom est le signal
    // d'intérêt le plus fort du produit, bien plus fiable qu'un clic sur un
    // pouce. On l'active donc implicitement, et l'IA en tient compte pour les
    // suggestions suivantes. Le pouce reste cliquable pour se dédire.
    const target = this.domains().find((d) => this.normName(d.name) === this.normName(this.brandReportName()));
    if (target && target.rating !== 'liked') this.setRating(target, 'liked');

    const emails = this.parseEmails(this.reportEmails());
    const force = this.forceRegen();
    this.showReportConfirm.set(false);
    this.showReport(this.brandReportName());
    this.generateBrandReport(this.brandReportName(), emails, force);
    this.forceRegen.set(false);
  }

  /**
   * Auto-agrandissement de la zone de description.
   *
   * Bornes : 5 lignes au minimum pour que le champ invite à écrire, ~16 au
   * maximum pour que le bouton d'action reste visible sans défiler. Au-delà,
   * la zone défile — mais on écrit rarement 16 lignes pour décrire un projet.
   */
  autoGrow(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    const line = 24;      // hauteur de ligne effective, en px
    const min = line * 5;
    const max = line * 16;
    el.style.height = 'auto';
    el.style.height = Math.min(Math.max(el.scrollHeight, min), max) + 'px';
  }

  private parseEmails(raw: string): string[] {
    return raw.split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.length > 0);
  }

  // Derniers paramètres, pour permettre un « Réessayer » gratuit après erreur.
  private lastReportName = '';
  private lastReportEmails: string[] = [];

  /** Relance la génération après une erreur — sans re-débit (idempotent côté API). */
  retryBrandReport(): void {
    this.generateBrandReport(this.lastReportName, this.lastReportEmails, false);
  }

  private generateBrandReport(name: string, emails: string[], force = false): void {
    if (this.brandReportLoading()) return;
    this.lastReportName = name;
    this.lastReportEmails = emails;
    this.brandReportLoading.set(true);
    this.brandReportError.set(null);
    this.brandReport.set(null);
    this.analytics.track('brand_report_cta_clicked');
    // Timeout client : un traitement qui n'aboutit pas devient une erreur
    // (réessayable) plutôt qu'un chargement infini.
    this.brandReportService.full(name, { emails, force }).pipe(timeout(90000)).subscribe({
      next: (report) => {
        this.isSampleReport.set(false);
        this.brandReport.set(report);
        this.markReported(name);
        if (typeof report.remainingCredits === 'number') {
          this.userService.updateCredits(report.remainingCredits);
          this.loadReportSummaries();
        }
        this.brandReportLoading.set(false);
      },
      error: (err) => {
        // 403 = crédits insuffisants ; TimeoutError ou autre = erreur générique réessayable.
        this.brandReportError.set(
          err?.status === 403
            ? this.translate.instant('WIZARD.STEP3.REPORT_NO_CREDITS')
            : this.translate.instant('WIZARD.STEP3.REPORT_ERROR'),
        );
        this.brandReportLoading.set(false);
      },
    });
  }


  // ─── Partage du rapport (Sally #5) ─────────────────────────────────────────
  readonly shareCopied = signal(false);
  copyShareLink(report: BrandReport): void {
    if (!report.shareToken || typeof window === 'undefined') return;
    const url = `${window.location.origin}/rapport/${report.shareToken}`;
    navigator.clipboard?.writeText(url).then(() => {
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2500);
    }).catch(() => { /* presse-papiers indisponible */ });
  }

  /** Libellés lisibles des critères de qualité (ordre stable). */
  readonly QUALITY_LABELS: Record<string, string> = {
    memorability: 'Mémorabilité',
    pronunciation: 'Prononciation',
    international: 'International',
    seo: 'SEO',
    distinctiveness: 'Distinctivité',
  };
  qualityCriteria(q: NameQuality): { label: string; value: number }[] {
    return Object.entries(q.scores).map(([k, v]) => ({ label: this.QUALITY_LABELS[k] ?? k, value: v }));
  }

  /** Point d'entrée officiel pour déposer une marque à l'INPI. */
  readonly INPI_DEPOSIT_URL = 'https://procedures.inpi.fr/?/marques/depot';

  /** Meilleur domaine à réserver (action héro) : .com libre en priorité, sinon 1er libre. */
  heroFreeDomain(report: BrandReport): { extension: string; domain: string } | null {
    const free = report.domains.filter((d) => d.status === 'free');
    return free.find((d) => d.extension === 'com') ?? free[0] ?? null;
  }

  /** Date de génération lisible. */
  formatReportDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return ''; }
  }

  // ─── Suivi des noms déjà rapportés (lien « Voir le rapport » vs bouton) ────
  readonly reportedNames = signal<Set<string>>(new Set());

  /**
   * Synthèses des noms vérifiés — verdicts déjà payés, affichés sur les cartes.
   * C'est ce qui rend plusieurs noms comparables côte à côte dans la grille,
   * là où l'arbitrage exigeait jusqu'ici d'ouvrir un rapport à la fois.
   */
  readonly reportSummaries = signal<BrandReportSummary[]>([]);

  private loadReportSummaries(): void {
    this.brandReportService.summaries().subscribe({
      next: (res) => this.reportSummaries.set(res.summaries ?? []),
      // Sans synthèse, les cartes restent à l'état non vérifié : dégradation
      // lisible, jamais un verdict inventé.
      error: () => this.reportSummaries.set([]),
    });
  }

  /**
   * Rafraîchissement : gratuit et sans confirmation — rien n'est débité.
   * Le serveur borne la fréquence et renvoie le rapport en cache s'il est
   * déjà à jour.
   */
  refreshBrandReport(name: string): void {
    this.brandReportService.full(name, { force: true }).subscribe({
      next: () => this.loadReportSummaries(),
      error: () => this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('WIZARD.STEP3.REPORT_ERROR'),
      }),
    });
  }
  private normName(name: string): string { return (name || '').trim().toLowerCase(); }
  hasReport(name: string): boolean { return this.reportedNames().has(this.normName(name)); }
  private markReported(name: string): void {
    this.reportedNames.update((s) => new Set(s).add(this.normName(name)));
  }
  /** Charge la liste des noms déjà rapportés (silencieux si non authentifié). */
  loadReportedNames(): void {
    this.brandReportService.mine().subscribe({
      next: (res) => {
        this.reportedNames.set(new Set((res.names ?? []).map((n) => this.normName(n))));
        this.loadReportSummaries();
      },
      error: () => { /* anonyme ou indisponible : liste vide */ },
    });
  }

  // ─── Rapport d'exemple (namorama) pour se faire une idée avant de payer ────
  readonly isSampleReport = signal(false);
  showSampleReport(): void {
    this.showReportConfirm.set(false);
    this.pushReportUrl(WizardComponent.SAMPLE_PARAM);
  }

  private loadSampleReport(): void {
    this.isSampleReport.set(true);
    this.brandReportName.set('namorama');
    this.brandReportError.set(null);
    this.brandReport.set(this.SAMPLE_REPORT);
  }
  readonly SAMPLE_REPORT: BrandReport = {
    name: 'namorama',
    handle: 'namorama',
    domains: [
      { extension: 'com', domain: 'namorama.com', status: 'taken' },
      { extension: 'fr', domain: 'namorama.fr', status: 'free' },
      { extension: 'io', domain: 'namorama.io', status: 'free' },
      { extension: 'net', domain: 'namorama.net', status: 'free' },
      { extension: 'app', domain: 'namorama.app', status: 'unknown' },
    ],
    // Les SIX plateformes réellement interrogées, comme un vrai rapport. Le
    // rapport d'exemple sert à savoir ce qu'on achète : en montrer quatre
    // revenait à annoncer moins que ce qui est livré.
    socials: [
      { platform: 'GitHub', handle: 'namorama', url: 'https://github.com/namorama', status: 'free' },
      { platform: 'LinkedIn', handle: 'namorama', url: 'https://www.linkedin.com/company/namorama', status: 'free' },
      { platform: 'Telegram', handle: 'namorama', url: 'https://t.me/namorama', status: 'free' },
      { platform: 'TikTok', handle: 'namorama', url: 'https://www.tiktok.com/@namorama', status: 'taken' },
      { platform: 'X', handle: 'namorama', url: 'https://x.com/namorama', status: 'taken' },
      { platform: 'YouTube', handle: 'namorama', url: 'https://www.youtube.com/@namorama', status: 'free' },
    ],
    trademark: {
      office: 'INPI',
      match: 'none',
      hits: [],
      deepLink: 'https://data.inpi.fr/search?q=namorama&type=brands',
    },
    quality: {
      score: 82,
      scores: { memorability: 4, pronunciation: 4, international: 5, seo: 3, distinctiveness: 5 },
      strengths: 'Court, sonore, international et très distinctif.',
      watchout: 'Sens peu explicite : à soutenir par un logo et une accroche claire.',
    },
    score: 68,
    generatedAt: new Date().toISOString(),
    disclaimer:
      "Signal indicatif de disponibilité. Ne remplace pas une recherche d'antériorité ni l'avis d'un conseil en propriété industrielle.",
  };

  /** Libellé/couleur d'un statut de disponibilité pour l'affichage du rapport. */
  reportStatusLabel(s: Availability): string {
    return s === 'free' ? 'Libre' : s === 'taken' ? 'Pris' : '?';
  }
  reportStatusColor(s: Availability): string {
    return s === 'free' ? '#16a34a' : s === 'taken' ? '#dc2626' : '#9ca3af';
  }
  /** Clés i18n pour uniformiser la langue du rapport (statuts + marque). */
  statusKey(s: Availability): string {
    return s === 'free' ? 'WIZARD.STEP3.STATUS_FREE' : s === 'taken' ? 'WIZARD.STEP3.STATUS_TAKEN' : 'WIZARD.STEP3.STATUS_UNKNOWN';
  }
  tmHeadKey(match: string): string {
    return `WIZARD.STEP3.TM_${(match || 'unknown').toUpperCase()}_HEAD`;
  }
  tmExplainKey(match: string): string {
    return `WIZARD.STEP3.TM_${(match || 'unknown').toUpperCase()}_EXPLAIN`;
  }



  private readonly SEARCH_TIMEOUT_MS = 30_000;
  private searchTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  /** Souscription au flux de recherche en cours, pour pouvoir l'annuler. */
  private searchSub: Subscription | null = null;

  filteredDomains = computed(() => {
    const mode = this.matchMode();
    const exts = this.selectedExtensions();
    const showDisliked = this.showDisliked();
    return this.domains().filter(d => {
      if (!showDisliked && d.rating === 'disliked') return false;
      if (exts.length === 0) return true;
      // Ignorer les extensions en cours de vérification (null) dans le filtre
      const knownExts = exts.filter(ext => d.allExtensions?.[ext] !== null && d.allExtensions?.[ext] !== undefined);
      if (knownExts.length === 0) return true; // toutes en cours → on garde la ligne
      const available = knownExts.filter(ext => d.allExtensions[ext] === true);
      return mode === 'all' ? available.length === knownExts.length : available.length > 0;
    });
  });

  constructor(
    public domainService: DomainService,
    public userService: UserService,
    public projectService: ProjectService,
    public keycloak: KeycloakService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private appRef: ApplicationRef,
    private sanitizer: DomSanitizer,
    private feedbackService: FeedbackService,
    private analytics: AnalyticsService,
    private brandReportService: BrandReportService,
  ) {}

  openFeedback() {
    this.feedbackService.openDialog();
  }

  async ngOnInit() {
    this.isLoggedIn.set(await this.keycloak.isLoggedIn());
    if (this.isLoggedIn()) this.loadReportedNames();
    // Afficher la landing uniquement aux visiteurs non connectés sur la page d'accueil
    if (!this.isLoggedIn() && !this.route.snapshot.params['id']) {
      this.showLanding.set(true);
    }
    this.updateLabels();
    this.translate.onLangChange.subscribe(() => this.updateLabels());

    // Écouter les demandes de reset (depuis le menu global)
    this.projectService.resetWizard$.subscribe(() => {
      this.resetProject();
    });

    // Le rapport est un écran adressable : c'est l'URL qui l'ouvre et le ferme.
    this.route.queryParams.subscribe(qp => {
      this.syncReportFromUrl(qp[WizardComponent.REPORT_PARAM] ?? null);
    });

    // S'abonner aux changements de paramètres d'URL
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== this.projectId()) {
        this.loadProject(id);
      }
    });

    const savedState = localStorage.getItem('wizard_state');
    if (!savedState && !this.route.snapshot.params['id']) {
      // Visite fraîche : pré-remplir l'extension locale + options régionales
      // selon la localisation détectée (un état restauré ou un projet priment).
      this.applyRegionalDefaults();
    }
    if (savedState) {
      const state = JSON.parse(savedState);
      this.description.set(state.description);
      this.projectName.set(state.projectName || '');
      this.refinedDescription.set(state.refinedDescription);
      this.setKeywords(state.keywords);
      this.selectedExtensions.set(state.selectedExtensions || ['.com']);
      this.matchMode.set(state.matchMode || 'any');
      this.projectId.set(state.projectId || null);
      if (state.minNameLength) {
        this.minNameLength.set(Math.min(Math.max(state.minNameLength, this.MIN_LENGTH_FLOOR), this.MAX_LENGTH_SETTING));
        this.minLengthTouched.set(true);
      }
      this.likedExamplesInput.set(state.likedExamplesInput || '');
      this.dislikedExamplesInput.set(state.dislikedExamplesInput || '');
      localStorage.removeItem('wizard_state');
      
      if (this.isLoggedIn()) {
        if (this.projectId()) {
          this.loadProject(this.projectId()!);
        } else if (state.pendingSearch) {
          // L'utilisateur avait cliqué "Rechercher" avant d'être invité à se connecter
          this.activeIndex.set(2);
          this.maxActiveIndex.set(2);
          this.findDomains();
        } else {
          this.activeIndex.set(1);
          this.maxActiveIndex.set(1);
        }
      }
    }
  }

  updateLabels() {
    this.translate.get([
      'WIZARD.STEPS.DESCRIPTION',
      'WIZARD.STEPS.KEYWORDS',
      'WIZARD.STEPS.DOMAINS',
      'WIZARD.STEP2.MATCH_ANY',
      'WIZARD.STEP2.MATCH_ALL'
    ]).subscribe(res => {
      this.items = [
        { label: res['WIZARD.STEPS.DESCRIPTION'] },
        { label: res['WIZARD.STEPS.KEYWORDS'] },
        { label: res['WIZARD.STEPS.DOMAINS'] }
      ];
      this.matchOptions.set([
        { label: res['WIZARD.STEP2.MATCH_ANY'], value: 'any' },
        { label: res['WIZARD.STEP2.MATCH_ALL'], value: 'all' }
      ]);
      this.cdr.detectChanges();
    });
  }

  startFromLanding() {
    this.showLanding.set(false);
  }

  goToExtensions() {
    // #4 — repères du marché chargés en tâche de fond, avant le lancement de la recherche
    this.loadCompetitors();
    this.nextStep(); // step 1 (keywords) → step 2 (extensions)
  }

  /**
   * #1 — récupère les contraintes de naming devinées depuis la description libre
   * et pré-remplit le réglage de longueur (sauf si l'utilisateur l'a déjà touché).
   */
  private loadNamingConstraints(description: string) {
    this.domainService.extractConstraints(description).subscribe({
      next: (c) => {
        this.minLengthFromBrief.set(c.minLength ?? null);
        this.briefAvoidWords.set(c.avoidWords ?? []);
        this.briefReferenceBrands.set(c.referenceBrands ?? []);
        if (!this.minLengthTouched() && typeof c.minLength === 'number') {
          const clamped = Math.min(Math.max(c.minLength, this.MIN_LENGTH_FLOOR), this.MAX_LENGTH_SETTING);
          this.minNameLength.set(clamped);
        }
        this.cdr.detectChanges();
      },
      error: () => { /* non bloquant : on garde le défaut */ },
    });
  }

  /**
   * #4 — produits/solutions déjà présents sur le marché décrit, avec leur domaine.
   * Résout toujours (jamais de rejet) : un échec de repérage ne doit pas bloquer
   * le passage à l'étape suivante.
   */
  loadCompetitors(force = false): Promise<void> {
    if (this.competitorsLoading() || (this.competitorsLoaded() && !force)) return Promise.resolve();
    const desc = this.refinedDescription() || this.description();
    if (!desc || desc.trim().length < 10) return Promise.resolve();

    this.competitorsLoading.set(true);
    this.cdr.detectChanges();

    return new Promise<void>((resolve) => {
      // `complete` ne se déclenche pas après `error` : les deux voies doivent
      // libérer la promesse, sinon l'étape 1 resterait bloquée sur un échec.
      const done = () => {
        this.competitorsLoaded.set(true);
        this.competitorsLoading.set(false);
        this.cdr.detectChanges();
        resolve();
      };
      this.domainService.findCompetitors(desc, this.effectiveLocale() ?? this.translate.currentLang()).subscribe({
        next: (res) => {
          this.competitors.set(res.competitors ?? []);
          this.competitorsSource.set(res.source ?? 'model');
        },
        error: done,
        complete: done,
      });
    });
  }

  /** #2 — relance en assouplissant la contrainte de longueur. */
  relaxLengthAndRetry() {
    this.analytics.track('no_result_relax_clicked', { from: this.minNameLength() });
    this.onMinLengthChange(Math.min(this.minNameLength() + 2, this.MAX_LENGTH_SETTING));
    this.showNoResultHelp.set(false);
    this.findDomains(false);
  }

  // Navigation
  nextStep() {
    this.activeIndex.update(val => val + 1);
    this.analytics.track('wizard_step_viewed', { step: this.activeIndex() });
    this.maxActiveIndex.set(Math.max(this.maxActiveIndex(), this.activeIndex()));
    this.cdr.detectChanges();
  }

  prevStep() {
    this.activeIndex.update(val => val - 1);
    this.cdr.detectChanges();
  }

  onStepChange(index: number) {
    if (index <= this.maxActiveIndex()) {
      this.activeIndex.set(index);
      this.cdr.detectChanges();
    }
  }

  finishEditingName() {
    this.isEditingName.set(false);
    if (this.projectId() && this.projectName()) {
      this.projectService.updateProject(this.projectId()!, { name: this.projectName() }).subscribe(() => {
        this.projectService.refreshProjects().subscribe();
      });
    }
  }

  // Gestion des projets
  openProjects() {
    this.projectService.refreshProjects().subscribe();
    this.projectService.showDrawer.set(true);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    // Une recherche en flux survivrait autrement à la navigation : se
    // désabonner déclenche l'abandon de la requête côté service.
    this.searchSub?.unsubscribe();
    this.searchSub = null;
  }

  loadProject(id: string) {
    this.projectService.showDrawer.set(false);
    this.loading.set(true);
    this.cdr.detectChanges();

    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.projectId.set(project.id);
        this.projectName.set(project.name);
        this.description.set(project.description);
        this.setKeywords(project.keywords);
        this.selectedExtensions.set(project.extensions);
        this.matchMode.set(project.matchMode);
        // Réglages de génération enregistrés avec le projet (#1 / #3)
        if (project.minLength) {
          // Un projet ancien peut porter une longueur qui n'est plus proposée (8, 9…) :
          // on la ramène dans la plage du sélecteur pour qu'il reste cohérent.
          this.minNameLength.set(Math.min(Math.max(project.minLength, this.MIN_LENGTH_FLOOR), this.MAX_LENGTH_SETTING));
          this.minLengthTouched.set(true);
        }
        this.likedExamplesInput.set((project.likedExamples ?? []).join(', '));
        this.dislikedExamplesInput.set((project.dislikedExamples ?? []).join(', '));

        this.domains.set(project.suggestions.map((s: any) => ({
          id: s.id,
          name: s.domainName,
          style: s.style || 'standard',
          allExtensions: s.availability,
          rating: s.rating ?? 'neutral',
          analysis: s.analysis ?? null,
          analysisPending: false,
        })));

        this.activeIndex.set(2);
        this.maxActiveIndex.set(2);
        this.loading.set(false);
        
        if (this.router.url !== `/projects/${id}`) {
          this.router.navigate(['/projects', id], { replaceUrl: true });
        }
        
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  deleteProject(event: Event, id: string) {
    event.stopPropagation();
    this.translate.get(['PROJECTS.CONFIRM_DELETE', 'PROJECTS.DELETE', 'PROJECTS.SUCCESS', 'PROJECTS.DELETE_SUCCESS']).subscribe(res => {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: res['PROJECTS.CONFIRM_DELETE'],
        header: res['PROJECTS.DELETE'],
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: "none",
        rejectIcon: "none",
        rejectButtonStyleClass: "p-button-text",
        accept: () => {
          this.projectService.deleteProject(id).subscribe(() => {
            this.projectService.projects.update(list => list.filter(p => p.id !== id));
            if (this.projectId() === id) {
              this.resetProject();
            }
            this.messageService.add({
              severity: 'success',
              summary: res['PROJECTS.SUCCESS'],
              detail: res['PROJECTS.DELETE_SUCCESS']
            });
            this.appRef.tick();
          });
        }
      });
    });
  }

  resetProject() {
    this.projectId.set(null);
    this.projectName.set('');
    this.description.set('');
    this.refinedDescription.set('');
    this.keywords.set([]);
    this.domains.set([]);
    this.newKeyword.set('');
    this.newExtension.set('');
    this.matchMode.set('any');
    this.localeOverride.set('');
    this.minNameLength.set(this.DEFAULT_MIN_LENGTH);
    this.minLengthTouched.set(false);
    this.minLengthFromBrief.set(null);
    this.briefAvoidWords.set([]);
    this.briefReferenceBrands.set([]);
    this.likedExamplesInput.set('');
    this.dislikedExamplesInput.set('');
    this.competitors.set([]);
    this.competitorsLoaded.set(false);
    this.showNoResultHelp.set(false);
    this.applyRegionalDefaults();
    this.activeIndex.set(0);
    this.maxActiveIndex.set(0);
    if (!this.isLoggedIn()) this.showLanding.set(true);
    this.router.navigate(['/app']);
    this.cdr.detectChanges();
  }

  private readonly ratingOrder: Record<string, number> = { liked: 0, neutral: 1, disliked: 2 };

  setRating(result: any, rating: 'liked' | 'disliked' | 'neutral') {
    // Mise à jour optimiste immédiate
    const previousRating = result.rating;
    result.rating = rating;
    this.domains.update(d => [...d].sort((a, b) => (this.ratingOrder[a.rating] ?? 1) - (this.ratingOrder[b.rating] ?? 1)));
    this.cdr.detectChanges();

    // Résultat streamé pas encore persisté (id null pendant une recherche en cours) :
    // on mémorise le rating, il sera envoyé au serveur dès que l'id sera attribué (event 'done').
    if (!result.id) {
      result.pendingRating = rating;
      return;
    }

    this.persistRating(result, rating, previousRating);
  }

  /** Persiste le rating côté serveur et déclenche l'analyse IA si « liked ». */
  private persistRating(result: any, rating: 'liked' | 'disliked' | 'neutral', previousRating?: string) {
    this.projectService.setRating(result.id, rating).subscribe({
      next: (res) => {
        result.rating = res.rating;
        // US-005 — déclencher l'analyse IA si liked et pas encore analysé
        if (res.rating === 'liked' && !result.analysis && !result.analysisPending) {
          setTimeout(() => {
            result.analysisPending = true;
            this.cdr.detectChanges();
            this.domainService.analyzeName(result.id, this.translate.currentLang() ?? undefined).subscribe({
              next: (r) => {
                result.analysis = r.analysis;
                result.analysisPending = false;
                this.cdr.detectChanges();
              },
              error: () => { result.analysisPending = false; this.cdr.detectChanges(); },
            });
          });
        }
      },
      error: () => {
        if (previousRating !== undefined) {
          result.rating = previousRating;
          this.domains.update(d => [...d].sort((a, b) => (this.ratingOrder[a.rating] ?? 1) - (this.ratingOrder[b.rating] ?? 1)));
          this.cdr.detectChanges();
        }
      }
    });
  }

  helpMePick(mode: 'all' | 'favourites' = 'all') {
    const candidates = mode === 'favourites' ? this.likedDomains() : this.filteredDomains();
    if (candidates.length < 2) return;

    const currentKey = mode + ':' + candidates.map(d => d.name).sort().join('|');

    // Résultat déjà en cache → afficher directement
    if (this.pickBestKey() === currentKey && this.pickBestResult()) {
      this.showPickDialog.set(true);
      return;
    }

    this.pickBestResult.set(null);
    this.pickBestLoading.set(true);
    this.showPickDialog.set(true);
    this.pickBestCandidates.set(candidates.map(d => d.name));

    const suggestions = candidates.map(d => ({
      name: d.name,
      analysis: d.analysis ?? null,
      extensions: d.allExtensions,
    }));

    this.domainService.pickBest(suggestions, this.translate.currentLang() ?? 'fr').subscribe({
      next: (result) => {
        this.pickBestResult.set(result);
        this.pickBestKey.set(currentKey);
        this.pickBestLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.pickBestLoading.set(false);
        this.showPickDialog.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  copyDomainName(name: string) {
    navigator.clipboard.writeText(name).then(() => {
      this.copiedDomain.set(name);
      setTimeout(() => this.copiedDomain.set(null), 1500);
    });
  }

  getDomainByName(name: string): any {
    return this.domains().find(d => d.name === name) ?? null;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  parseAnalysisScore(analysis: string | null): number {
    if (!analysis) return 0;
    try {
      const parsed = JSON.parse(analysis);
      if (parsed.scores) {
        const vals = Object.values(parsed.scores) as number[];
        if (vals.length > 0) return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      }
    } catch {}
    // Ancien format texte : chercher des patterns comme "4/5", ": 4 —", "★★★★"
    const numericMatches = analysis.match(/:\s*([1-5])(?:\/5)?\s*[—–-]/g);
    if (numericMatches && numericMatches.length > 0) {
      const scores = numericMatches.map(m => parseInt(m.match(/([1-5])/)?.[1] ?? '0'));
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    // Fallback : compter les ★ (pleines ou avec ☆)
    const lines = analysis.split('\n');
    const criteriaScores: number[] = [];
    for (const line of lines) {
      const stars = (line.match(/★/g) || []).length;
      const total = (line.match(/[★☆]/g) || []).length;
      if (total >= 1 && total <= 5 && stars >= 1) criteriaScores.push(stars);
    }
    if (criteriaScores.length > 0) {
      return criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length;
    }
    return 0;
  }

  getStarArray(score: number): boolean[] {
    const full = Math.round(score);
    return Array.from({ length: 5 }, (_, i) => i < full);
  }

  /** Passé tel quel à la grille de résultats, qui n'a pas de sanitizer. */
  readonly analysisRenderer = (a: string | null): SafeHtml => this.parseAnalysisHtml(a);

  parseAnalysisHtml(analysis: string | null): SafeHtml {
    if (!analysis) return this.sanitizer.bypassSecurityTrustHtml('');
    try {
      const parsed = JSON.parse(analysis);
      if (parsed.scores && parsed.comments) {
        const scoreColor = (s: number) =>
          s <= 1 ? '#ef4444' : s === 2 ? '#f97316' : s === 3 ? '#f59e0b' : s === 4 ? '#84cc16' : '#16a34a';

        const criteria: [string, string][] = [
          ['memorability', 'Mémorabilité'],
          ['pronunciation', 'Prononciation'],
          ['international', 'Portée internationale'],
          ['seo', 'SEO'],
          ['distinctiveness', 'Distinctivité'],
        ];

        const cells = criteria.map(([key, label]) => {
          const score: number = parsed.scores[key] ?? 0;
          const comment: string = this.escapeHtml(parsed.comments[key] ?? '');
          const safeLabel = this.escapeHtml(label);
          const color = scoreColor(score);
          const pct = (score / 5) * 100;
          return `
            <div style="min-width:0">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.2rem">
                <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280">${safeLabel}</span>
                <span style="font-size:0.78rem;font-weight:800;color:${color}">${score}/5</span>
              </div>
              <div style="height:4px;background:#e5e7eb;border-radius:9999px;margin-bottom:0.3rem">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:9999px"></div>
              </div>
              <span style="font-size:0.75rem;color:#6b7280;line-height:1.4">${comment}</span>
            </div>`;
        }).join('');

        const grid = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem 1.25rem">${cells}</div>`;

        const safeStrengths = parsed.strengths ? this.escapeHtml(parsed.strengths) : '';
        const safeWatchout = parsed.watchout ? this.escapeHtml(parsed.watchout) : '';
        const footer = (safeStrengths || safeWatchout) ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;border-top:1px solid #e5e7eb;margin-top:0.75rem;padding-top:0.625rem">
            ${safeStrengths ? `<div style="font-size:0.76rem;color:#374151;line-height:1.5"><span style="font-weight:700">✅ Points forts</span><br>${safeStrengths}</div>` : ''}
            ${safeWatchout  ? `<div style="font-size:0.76rem;color:#374151;line-height:1.5"><span style="font-weight:700">⚠️ Attention</span><br>${safeWatchout}</div>`  : ''}
          </div>` : '';

        return this.sanitizer.bypassSecurityTrustHtml(grid + footer);
      }
    } catch {}
    // Ancien format texte — échapper d'abord, puis restaurer le balisage autorisé
    const escaped = this.escapeHtml(analysis);
    const html = escaped
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/★/g, '<span style="color:#f59e0b">★</span>')
      .replace(/☆/g, '<span style="color:#d1d5db">☆</span>')
      .replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleAnalysis(id: string) {
    this.expandedAnalysisId.set(this.expandedAnalysisId() === id ? null : id);
  }

  /**
   * Seul point d'affectation des mots-clés : dédoublonne et tronque au plafond
   * accepté par l'API. Les listes venant de l'IA, d'un projet enregistré ou du
   * localStorage ne sont pas bornées à la source.
   */
  private setKeywords(list: string[] | null | undefined) {
    const unique = [...new Set((list ?? []).filter(k => !!k))];
    this.keywords.set(unique.slice(0, this.MAX_KEYWORDS));
  }

  addKeyword() {
    if (this.keywordsFull()) return;
    if (this.newKeyword() && !this.keywords().includes(this.newKeyword())) {
      this.keywords.update(k => [...k, this.newKeyword()]);
      this.newKeyword.set('');
      this.cdr.detectChanges();
    }
  }

  removeKeyword(keyword: string) {
    this.keywords.update(k => k.filter(item => item !== keyword));
    this.cdr.detectChanges();
  }

  addExtension() {
    const raw = this.newExtension().trim().toLowerCase();
    if (!raw) return;

    // Séparer par espace, virgule ou point-virgule
    const tokens = raw.split(/[\s,;]+/).filter(t => t.length > 0);
    const toAdd = tokens
      .map(t => t.startsWith('.') ? t : '.' + t)
      .filter(ext => /^\.[a-z]{2,10}$/.test(ext) && !this.selectedExtensions().includes(ext));

    if (toAdd.length > 0) {
      // Ajouter une extension ne change pas le critère de disponibilité :
      // passer de « au moins une » à « toutes » resserre fortement la
      // recherche, et ce n'est pas ce que demande un clic sur « + ».
      this.selectedExtensions.update(e => [...e, ...toAdd]);
      this.persistExtensions();
      this.recheckIfNeeded();
    }
    this.newExtension.set('');
    this.cdr.detectChanges();
  }

  removeExtension(ext: string) {
    this.selectedExtensions.update(e => e.filter(item => item !== ext));
    this.persistExtensions();
    this.recheckIfNeeded();
    this.cdr.detectChanges();
  }

  private persistExtensions() {
    if (this.projectId()) {
      this.projectService.updateProject(this.projectId()!, { extensions: this.selectedExtensions() }).subscribe();
    }
  }

  recheckIfNeeded() {
    if (this.domains().length > 0 && this.selectedExtensions().length > 0) {
      this.recheckDomains();
    }
  }

  recheckDomains() {
    const names = this.domains().map(d => d.name);
    const extensions = this.selectedExtensions();
    this.recheckLoading.set(true);

    // Initialise les nouvelles extensions à null (indéterminé) pour distinguer
    // "en cours de vérification" de "indisponible confirmé"
    this.domains.update(list =>
      list.map(d => {
        const updated: Record<string, boolean | null> = { ...d.allExtensions };
        for (const ext of extensions) {
          if (!(ext in updated)) updated[ext] = null;
        }
        return { ...d, allExtensions: updated };
      })
    );
    this.cdr.detectChanges();

    this.domainService.recheckDomains(names, extensions).subscribe({
      next: (res) => {
        this.domains.update(list =>
          list.map(d => {
            const updated = res.domains.find(r => r.name === d.name);
            return updated ? { ...d, allExtensions: updated.allExtensions } : d;
          })
        );

        // Persister les nouvelles disponibilités pour toutes les suggestions sauvegardées
        const toSave = this.domains()
          .filter(d => d.id)
          .map(d => ({ id: d.id as string, availability: d.allExtensions as Record<string, boolean> }));
        if (toSave.length > 0) {
          this.projectService.updateSuggestionsAvailability(toSave).subscribe();
        }

        this.recheckLoading.set(false);
        this.appRef.tick();
      },
      error: () => {
        this.recheckLoading.set(false);
        this.translate.get('WIZARD.RECHECK_ERROR').subscribe(msg => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 4000 });
        });
        this.cdr.detectChanges();
      }
    });
  }


  private startSearchTimeout() {
    this.clearSearchTimeout();
    this.searchTimeoutHandle = setTimeout(() => {
      if (!this.loading()) return;
      this.translate.get(['WIZARD.TIMEOUT.MESSAGE', 'WIZARD.TIMEOUT.KEEP_WAITING', 'WIZARD.TIMEOUT.CANCEL']).subscribe(res => {
        this.confirmationService.confirm({
          message: res['WIZARD.TIMEOUT.MESSAGE'],
          acceptLabel: res['WIZARD.TIMEOUT.KEEP_WAITING'],
          rejectLabel: res['WIZARD.TIMEOUT.CANCEL'],
          acceptIcon: 'none',
          rejectIcon: 'none',
          rejectButtonStyleClass: 'p-button-text',
          accept: () => { /* on continue d'attendre */ },
          reject: () => {
            this.loading.set(false);
            this.activeIndex.set(2);
            this.cdr.detectChanges();
          }
        });
      });
    }, this.SEARCH_TIMEOUT_MS);
  }

  private clearSearchTimeout() {
    if (this.searchTimeoutHandle !== null) {
      clearTimeout(this.searchTimeoutHandle);
      this.searchTimeoutHandle = null;
    }
  }

  /** Issue #2 — interrompt la recherche en cours (abort du flux) et restaure l'UI. */
  cancelSearch() {
    this.analytics.track('search_cancelled_by_user', { found: this.domains().length });
    if (this.searchSub) {
      this.searchSub.unsubscribe(); // déclenche controller.abort() côté service
      this.searchSub = null;
    }
    this.clearSearchTimeout();
    this.streamProgress.set(null);
    this.loading.set(false);
    this.cdr.detectChanges();
  }

  copyTable() {
    const exts = this.selectedExtensions();
    const header = ['Domain', ...exts].join('\t');
    const rows = this.filteredDomains().map(d => {
      const cols = exts.map(ext =>
        d.allExtensions[ext] === true ? '✓' : d.allExtensions[ext] === false ? '✗' : '?'
      );
      return [d.name, ...cols].join('\t');
    });
    const text = [header, ...rows].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.copiedDomain.set('table');
      setTimeout(() => this.copiedDomain.set(null), 2000);
    });
  }

  // Actions IA
  async refine() {
    this.loading.set(true);
    this.cdr.detectChanges();
    this.domainService.refineDescription(this.description()).subscribe({
      next: (res: { refined: string }) => {
        this.refinedDescription.set(res.refined);
        this.loading.set(false);
        // Suggérer un nom dès que la description est raffinée
        this.autoSuggestName(res.refined);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  autoSuggestName(description: string) {
    // Ne suggérer que si le nom est vide ou générique
    if (!this.projectName() || this.projectName().includes('...')) {
      this.domainService.suggestProjectName(description).subscribe(res => {
        if (res.suggestedName) {
          this.projectName.set(res.suggestedName);
          this.cdr.detectChanges();
        }
      });
    }
  }

  async goToKeywords() {
    this.loading.set(true);
    this.cdr.detectChanges();
    const descToUse = this.refinedDescription() || this.description();
    
    // Suggérer un nom avant de passer aux mots-clés si ce n'est pas déjà fait
    if (!this.projectName() || this.projectName().includes('...')) {
      this.domainService.suggestProjectName(descToUse).subscribe(res => {
        if (res.suggestedName) this.projectName.set(res.suggestedName);
      });
    }

    // #1 — en parallèle des mots-clés : contraintes de naming déduites du brief
    this.loadNamingConstraints(descToUse);

    // Le repérage du marché part en tâche de fond et n'est pas attendu : il
    // met 23 s en médiane et jusqu'à 45 s (mesuré en production), contre 3 s
    // pour les mots-clés. Attendre le plus lent des deux retenait l'écran de
    // configuration une trentaine de secondes sans rien apporter — la section
    // « marché » porte son propre indicateur de chargement et se remplit
    // seule, pendant que l'utilisateur saisit ses mots-clés et ses réglages.
    this.loadCompetitors();

    const keywords$ = this.domainService
      .generateKeywords(descToUse, this.effectiveLocale() ?? this.translate.currentLang())
      .pipe(catchError(() => of(null)));

    const keywordsResult = await firstValueFrom(keywords$);

    this.loading.set(false);

    if (keywordsResult) {
      this.setKeywords(keywordsResult.keywords);
      this.nextStep();
    }
    this.cdr.detectChanges();
  }

  private meetsMatchMode(allExtensions: Record<string, boolean | null>): boolean {
    const exts = this.selectedExtensions();
    const known = exts.filter(ext => allExtensions[ext] !== null && allExtensions[ext] !== undefined);
    if (known.length === 0) return true;
    const available = known.filter(ext => allExtensions[ext] === true);
    return this.matchMode() === 'all' ? available.length === known.length : available.length > 0;
  }

  addManualDomain() {
    // Sépare par espace, virgule ou point-virgule ; normalise chaque token
    const newNames = [
      ...new Set(
        this.newDomainName().trim().toLowerCase()
          .split(/[\s,;]+/)
          .filter(t => t.length > 0)
          .map(t => t.replace(/^\./, '').replace(/\.[a-z]{2,10}$/, ''))
          .filter(n => n.length > 0)
          .filter(n => !this.domains().some(d => d.name === n)) // exclure doublons
      )
    ];

    if (newNames.length === 0) {
      this.newDomainName.set('');
      return;
    }

    // Lignes temporaires avec spinners — auto-liked immédiat (US-025)
    const tempRows = newNames.map(name => ({
      id: null as string | null,
      name,
      // `undefined` = vérification en cours (spinner). `null` est désormais
      // réservé à une réponse de l'API : « impossible à déterminer ».
      allExtensions: Object.fromEntries(this.selectedExtensions().map(ext => [ext, undefined])),
      rating: 'liked' as const,
      isManual: true,
      analysisPending: false,
      analysis: null as string | null,
    }));
    this.domains.update(d => [...d, ...tempRows].sort((a, b) => (this.ratingOrder[a.rating] ?? 1) - (this.ratingOrder[b.rating] ?? 1)));
    this.newDomainName.set('');
    this.addingDomain.set(true);
    this.cdr.detectChanges();

    this.domainService.recheckDomains(newNames, this.selectedExtensions()).subscribe({
      next: (res) => {
        // Mettre à jour les lignes avec la vraie disponibilité
        this.domains.update(list =>
          list.map(d => {
            if (!d.isManual || !newNames.includes(d.name)) return d;
            const checked = res.domains.find((r: any) => r.name === d.name);
            return checked ? { ...d, allExtensions: checked.allExtensions } : d;
          })
        );

        // Avertir pour les noms qui ne remplissent pas les critères du filtre actif
        const hidden = res.domains.filter((r: any) =>
          newNames.includes(r.name) && !this.meetsMatchMode(r.allExtensions)
        );
        if (hidden.length > 0) {
          const names = hidden.map((r: any) => r.name).join(', ');
          this.translate.get(['WIZARD.STEP3.MANUAL_NOT_AVAILABLE', 'WIZARD.STEP3.MANUAL_NOT_AVAILABLE_SUMMARY'],
            { names }).subscribe(t => {
            this.messageService.add({
              severity: 'warn',
              summary: t['WIZARD.STEP3.MANUAL_NOT_AVAILABLE_SUMMARY'],
              detail: t['WIZARD.STEP3.MANUAL_NOT_AVAILABLE'].replace('{{names}}', names),
              life: 6000,
            });
          });
        }

        // Sauvegarder dans le projet + auto-favourite + analyse IA (US-025)
        if (this.projectId()) {
          res.domains.forEach((r: any) => {
            if (!newNames.includes(r.name)) return;
            this.projectService.addSuggestion(this.projectId()!, r.name, r.allExtensions as Record<string, boolean>).subscribe({
              next: (saved) => {
                this.domains.update(list =>
                  list.map(d => d.name === r.name && d.isManual ? { ...d, id: saved.id } : d)
                );
                // Persister le rating liked côté serveur puis déclencher l'analyse IA
                this.projectService.setRating(saved.id, 'liked').subscribe({
                  next: () => {
                    const domain = this.domains().find(d => d.id === saved.id);
                    if (domain && !domain.analysis && !domain.analysisPending) {
                      setTimeout(() => {
                        domain.analysisPending = true;
                        this.cdr.detectChanges();
                        this.domainService.analyzeName(saved.id, this.translate.currentLang() ?? undefined).subscribe({
                          next: (a) => {
                            domain.analysis = a.analysis;
                            domain.analysisPending = false;
                            this.cdr.detectChanges();
                          },
                          error: () => { domain.analysisPending = false; this.cdr.detectChanges(); },
                        });
                      });
                    }
                  },
                });
              },
            });
          });
        }

        this.addingDomain.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.addingDomain.set(false);
        this.domains.update(list => list.filter(d => !newNames.includes(d.name) || !d.isManual));
        this.cdr.detectChanges();
      },
    });
  }

  async findDomains(append = false) {
    if (!this.isLoggedIn()) {
      const state = {
        description: this.description(),
        projectName: this.projectName(),
        refinedDescription: this.refinedDescription(),
        keywords: this.keywords(),
        selectedExtensions: this.selectedExtensions(),
        matchMode: this.matchMode(),
        projectId: this.projectId(),
        minNameLength: this.minNameLength(),
        likedExamplesInput: this.likedExamplesInput(),
        dislikedExamplesInput: this.dislikedExamplesInput(),
        pendingSearch: true,
      };
      localStorage.setItem('wizard_state', JSON.stringify(state));
      // Point de fuite majeur : on quitte l'app pour Keycloak. Si l'écart entre
      // ce compteur et search_started est important, c'est ici que ça bloque.
      this.analytics.track('login_required_before_search');
      this.keycloak.login();
      return;
    }

    if (!append) this.domains.set([]);
    this.showNoResultHelp.set(false);
    this.loading.set(true);
    this.streamProgress.set({ phase: 'generating', checked: 0, found: 0 });
    this.startSearchTimeout();
    this.cdr.detectChanges();

    try {
      await this.keycloak.updateToken(30);
    } catch {
      await this.keycloak.login();
      return;
    }
    const token = await this.keycloak.getToken();

    this.searchSub = this.domainService.searchDomainsStream({
      description: this.refinedDescription() || this.description(),
      keywords: this.keywords(),
      extensions: this.selectedExtensions(),
      matchMode: this.matchMode(),
      projectId: this.projectId() || undefined,
      projectName: this.projectName() || undefined,
      locale: this.effectiveLocale(),
      // US-015 — lors d'un append, exclure tous les noms déjà évalués
      excludeNames: append ? this.domains().map(d => d.name) : [],
      // US-032 — naming styles (local mode only)
      descriptiveNames: this.isLocal() ? this.descriptiveNames() : false,
      culturalNames: this.isLocal() ? this.culturalNames() : false,
      // US-046 — feedback utilisateur pour affiner la génération suivante
      likedNames: this.domains().filter(d => d.rating === 'liked').map(d => d.name),
      dislikedNames: this.domains().filter(d => d.rating === 'disliked').map(d => d.name),
      // #1 — longueur mini explicite (prime sur celle déduite du brief)
      minLength: this.minNameLength(),
      // #3 — références de style : saisie libre + domaines du marché aimés
      likedExamples: this.styleReferences(),
      // #4 — reste du marché : contexte dont il faut se démarquer
      competitorDomains: this.neutralCompetitorDomains(),
      // #4 — styles explicitement rejetés : saisie libre + marché rejeté
      dislikedStyleDomains: this.rejectedStyleReferences(),
    }, token).subscribe({
      next: (event: any) => {
        this.clearSearchTimeout();
        this.startSearchTimeout();

        if (event.type === 'generating') {
          this.streamProgress.update(p => p ? { ...p, phase: 'generating' } : null);

        } else if (event.type === 'candidate') {
          this.streamProgress.update(p => p
            ? { ...p, phase: 'checking', name: event.name, checked: event.checkedSoFar }
            : null);

        } else if (event.type === 'result') {
          const domain = { id: null as string | null, name: event.domain.name, style: event.domain.style || 'standard', allExtensions: event.domain.allExtensions, rating: 'neutral' as const };
          this.domains.update(d => [...d, domain]);
          this.streamProgress.update(p => p ? { ...p, found: this.domains().length } : null);

        } else if (event.type === 'done') {
          this.totalChecked.set(event.totalChecked || 0);
          // Mettre à jour les IDs des suggestions sauvegardées
          if (event.savedDomains?.length) {
            this.domains.update(list => list.map(d => {
              const saved = event.savedDomains.find((s: any) => s.name === d.name);
              return saved ? { ...d, id: saved.id } : d;
            }));
          }

          // Issue #1 — persister les ratings « likés » pendant la recherche (id désormais dispo)
          this.domains().forEach(d => {
            if (d.id && d.pendingRating) {
              const rating = d.pendingRating;
              delete d.pendingRating;
              this.persistRating(d, rating);
            }
          });

          // #2 — rien trouvé : on propose d'assouplir la longueur ou de poursuivre
          if ((event.found ?? 0) === 0 && this.domains().length === 0) {
            if (event.minLengthUsed && !this.minLengthTouched()) {
              this.minNameLength.set(event.minLengthUsed);
            }
            this.showNoResultHelp.set(true);
          }

          // Issue #3 — moins de suggestions trouvées que demandé dans le temps imparti
          // (le panneau dédié prend le relais quand on n'a strictement rien trouvé)
          if (event.requested > 0 && (event.found ?? 0) > 0 && (event.found ?? 0) < event.requested) {
            this.translate.get(['WIZARD.STEP3.PARTIAL_RESULTS', 'WIZARD.STEP3.PARTIAL_SUMMARY'],
              { count: event.found ?? 0 }).subscribe(t => {
              this.messageService.add({
                key: 'app', // toast racine (persistant) — le toast du wizard est détruit par la navigation vers /projects/:id
                severity: 'info',
                summary: t['WIZARD.STEP3.PARTIAL_SUMMARY'],
                detail: t['WIZARD.STEP3.PARTIAL_RESULTS'],
                life: 10000,
              });
            });
          }
          if (event.projectId) {
            this.projectId.set(event.projectId);
            if (this.router.url !== `/projects/${event.projectId}`) {
              // Simple alignement de l'URL sur le projet créé : on passe par
              // Location plutôt que par le routeur, car une navigation
              // ramènerait la page en haut (restauration du défilement) alors
              // que l'utilisateur est en train de lire ses résultats.
              this.location.replaceState(`/projects/${event.projectId}`);
            }
          }
          if (event.remainingCredits !== undefined) {
            this.userService.updateCredits(event.remainingCredits);
          }
          this.projectService.refreshProjects().subscribe();

        } else if (event.type === 'error') {
          this.streamProgress.set(null);
          this.loading.set(false);
        }

        this.cdr.detectChanges();
      },
      complete: () => {
        this.streamProgress.set(null);
        this.loading.set(false);
        this.clearSearchTimeout();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.streamProgress.set(null);
        this.loading.set(false);
        this.clearSearchTimeout();
        if (err.status === 403) this.projectService.showCreditDialog.set(true);
        this.cdr.detectChanges();
      },
    });
  }

  }

  