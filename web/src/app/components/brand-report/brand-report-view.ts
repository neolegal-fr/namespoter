import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandReport, ReportLike, Availability, NameQuality, TrademarkHit } from '../../services/brand-report';

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
              <!-- Réactualiser se demande EN LISANT la date : c'est elle qui
                   fait douter de la fraîcheur, pas un bouton en pied de page.
                   Gratuit — la mise à jour ne redébite rien. -->
              <ng-content select="[refresh]"></ng-content>
            </p>
            <h2 class="rv-name">{{ r.name }}</h2>
          </div>
          <!-- Les ACTIONS du document, là où on les cherche : en haut à
               droite du document lui-même, pas dans la barre de la page.
               Elles remplacent la pastille de synthèse, qui répétait en un mot
               ce que les quatre sections disent en détail juste dessous — et
               qui, sur un document de décision, invitait à ne pas les lire. -->
          <div class="rv-head__actions rv-noprint">
            <ng-content select="[actions]"></ng-content>
          </div>
        </header>

        <!-- Le projet AVANT le nom : un rapport se relit des semaines plus
             tard, et se partage à un associé qui n'était pas là quand la
             recherche a tourné. Sans la description ni les contraintes, il
             faut deviner pourquoi ce nom a été proposé. -->
        @if (context; as ctx) {
          @if (ctx.description) {
            <section class="rv-section">
              <div class="rv-section__head">
                <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_PROJECT' | translate }}</h3>
              </div>
              <p class="rv-quote">{{ ctx.description }}</p>
            </section>
          }
          @if (ctx.constraints?.length) {
            <section class="rv-section">
              <div class="rv-section__head">
                <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_CONSTRAINTS' | translate }}</h3>
              </div>
              <div class="rv-criteria">
                @for (c of ctx.constraints; track c.label) {
                  <span class="rv-criterion">{{ c.label | translate }} <strong>{{ c.value }}</strong></span>
                }
              </div>
            </section>
          }
        }

        <!-- L'ordre du document suit celui de la décision : d'abord CE QUE
             VAUT le nom, ensuite ce qui peut l'empêcher. Les domaines et
             l'analyse sont acquis dès la recherche ; marques et réseaux
             viennent après, parce qu'ils s'achètent. -->
        @if (r.quality; as q) {
          <section class="rv-section">
            <div class="rv-section__head">
              <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_QUALITY' | translate }}</h3>
              <!-- Le chiffre reste en couleur de texte ; c'est une PASTILLE
                   de verdict qui porte l'appréciation. Un nombre coloré se lit
                   comme un état sans dire lequel, et introduit des couleurs
                   ad hoc hors de l'échelle du produit. -->
              <span class="rv-section__meta">
                <span class="nm-verdict" [class]="'nm-verdict--' + scoreTone(q.score)">{{ scoreKey(q.score) | translate }}</span>
                <strong style="color: var(--nm-app-text)">{{ q.score }}/100</strong>
              </span>
            </div>
            <!-- D'ABORD ce que le nom raconte, ensuite ses notes. Les cinq
                 critères disent si le nom est bon ; ils ne disent pas ce qu'il
                 veut dire — et c'est la première question qu'on se pose devant
                 un nom inventé, celle qu'il faudra savoir répondre à un
                 associé. -->
            @if (q.origin) {
              <p class="rv-origin">{{ q.origin }}</p>
            }
            <!-- UNE seule présentation de la qualité, que le rapport soit
                 acquis ou non. La page verrouillée en avait une jolie (barres,
                 commentaire par critère) et la page acquise une liste plate de
                 « 4/5 » : deux rendus pour la même donnée, selon qu'on avait
                 payé. La barre situe la note d'un coup d'œil, et le commentaire
                 dit POURQUOI — « International 2/5 » ne se défend pas devant un
                 associé, « sens peu transparent hors du français » si. -->
            <div class="rv-criteria">
              @for (c of criteria(q); track c.label) {
                <div class="rv-criterion">
                  <div class="rv-criterion__head">
                    <span class="rv-criterion__label">{{ c.label }}</span>
                    <strong class="rv-criterion__score" [class]="'rv-criterion__score--' + c.tone">{{ c.value }}/5</strong>
                  </div>
                  <div class="rv-criterion__bar" aria-hidden="true">
                    <span [class]="'rv-criterion__fill rv-criterion__fill--' + c.tone" [style.width.%]="c.value * 20"></span>
                  </div>
                  @if (c.comment) { <span class="rv-criterion__note">{{ c.comment }}</span> }
                </div>
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

        <!-- Noms de domaine -->
        <section class="rv-section">
          <div class="rv-section__head">
            <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_DOMAINS' | translate }}</h3>
            <!-- Ni « RDAP » ni l'heure : le nom du protocole ne dit rien à qui
                 lit le document, et la date de génération est déjà en tête. -->
          </div>
          @for (d of r.domains; track d.domain) {
            <div class="rv-row">
              <span class="rv-row__label">{{ d.domain }}</span>
              @if (d.status === 'free') {
                <!-- Le bureau se choisit SUR le bouton, pas dans un réglage à
                     part : au moment de réserver, la question « chez qui ? » est
                     la même que « je réserve ». Le choix est mémorisé, donc on
                     ne le repose pas à chaque ligne. -->
                <span class="rv-reserve rv-noprint">
                  <a class="rv-link" [href]="reserveUrl(r.name, d.extension, registrar())" target="_blank" rel="noopener noreferrer">
                    <i class="pi pi-shopping-cart"></i> {{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }}
                  </a>
                  <label class="rv-reserve__who">
                    <span class="sr-only">{{ 'WIZARD.STEP3.REPORT_REGISTRAR' | translate }}</span>
                    <select [value]="registrar()" (change)="setRegistrar($any($event.target).value)">
                      @for (reg of REGISTRARS; track reg.label; let i = $index) {
                        <option [value]="i">{{ reg.label }}</option>
                      }
                    </select>
                  </label>
                </span>
              }
              <span class="rv-badge" [class]="'rv-badge--' + badgeTone(d.status)">
                {{ statusKey(d.status) | translate }}
              </span>
            </div>
          }
        </section>

        <!-- Marques — INPI, EUIPO et OMPI, périmètre nommé explicitement -->
        @if (r.trademark; as tm) {
        <section class="rv-section">
          <div class="rv-section__head">
            <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_TRADEMARK_SCOPE' | translate }}</h3>
            @if (allClasses(tm.hits); as cls) {
              @if (cls) { <span class="rv-section__meta">{{ 'WIZARD.STEP3.REPORT_CLASSES' | translate:{ list: cls } }}</span> }
            }
          </div>

          <div class="rv-row">
            <span class="rv-row__label">{{ 'WIZARD.STEP3.REPORT_TM_IDENTICAL' | translate:{ name: r.name } }}</span>
            <span class="rv-badge" [class]="'rv-badge--' + tmTone(tm.match)">
              {{ tmHeadKey(tm.match) | translate }}
            </span>
          </div>

          <p class="rv-explain" [innerHTML]="tmExplainKey(tm.match) | translate"></p>

          <!-- La RAISON du « non vérifiable », quand le serveur la donne.
               Sans elle, une configuration manquante et une panne de l'INPI
               affichent le même texte : impossible de savoir s'il faut
               réessayer plus tard ou corriger un réglage. -->
          @if (tm.match === 'unknown' && tm.note) {
            <p class="rv-note">{{ r.trademark.note }}</p>
          }

          @if (tm.hits.length) {
            <ul class="rv-hits">
              @for (h of tm.hits.slice(0, 8); track h.name + h.applicationNumber) {
                <li>
                  {{ h.name }}
                  <span style="color: var(--nm-app-text-2)">
                    ({{ officeLabel(h.collection) }}@if (h.classes.length) { · {{ 'WIZARD.STEP3.REPORT_CLASSES' | translate:{ list: h.classes.join(', ') } }} })
                  </span>
                </li>
              }
            </ul>
          }

          <div class="rv-actions">
            @if (tm.match === 'none' || tm.match === 'similar') {
              <a class="rv-link" [href]="INPI_DEPOSIT_URL" target="_blank" rel="noopener noreferrer">
                <i class="pi pi-shield"></i> {{ 'WIZARD.STEP3.REPORT_DEPOSIT' | translate }}
              </a>
            }
            <a class="rv-link" [href]="tm.deepLink" target="_blank" rel="noopener noreferrer">
              <i class="pi pi-search"></i> {{ 'WIZARD.STEP3.REPORT_OFFICIAL' | translate }}
            </a>
          </div>
        </section>
        }

        <!-- Réseaux sociaux -->
        @if (r.socials?.length) {
          <section class="rv-section">
            <div class="rv-section__head">
              <h3 class="rv-section__title">{{ 'WIZARD.STEP3.REPORT_SOCIALS' | translate }}</h3>
              <span class="rv-section__meta">
                {{ 'WIZARD.STEP3.REPORT_PLATFORMS' | translate:{ n: r.socials?.length ?? 0 } }}
              </span>
            </div>
            @for (s of r.socials ?? []; track s.platform) {
              <div class="rv-row">
                <span class="rv-row__label">
                  <!-- Le logo officiel, monochrome : il identifie le réseau
                       sans lecture. La couleur reste au verdict, à droite. -->
                  @if (socialIcon(s.platform) === 'x') {
                    <svg class="rv-social__logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path fill="currentColor" [attr.d]="X_LOGO"></path>
                    </svg>
                  } @else {
                    <i [class]="'rv-social__logo pi ' + socialIcon(s.platform)" aria-hidden="true"></i>
                  }
                  <a [href]="s.url" target="_blank" rel="noopener noreferrer">{{ s.platform }} · &#64;{{ r.handle }}</a>
                </span>
                <span class="rv-badge" [class]="'rv-badge--' + badgeTone(s.status)">
                  {{ statusKey(s.status) | translate }}
                </span>
              </div>
            }
          </section>
        }

        <!-- Palier payant, PAS ENCORE ACQUIS.
             Il se pose là où marque et réseaux s'afficheront une fois achetés :
             la substitution se lit d'elle-même, sans qu'on ait à expliquer ce
             qui manque. Le contenu vient de l'appelant — la page ne connaît
             donc ni prix ni solde, et surtout aucun verdict payant. -->
        @if (locked) {
          <ng-content select="[locked]"></ng-content>
        }

        <!-- Pied : avertissement obligatoire + action de réservation -->
        <footer class="rv-foot">
          @if (r.disclaimer) {
            <p class="rv-disclaimer">
              {{ r.disclaimer }}
              {{ 'WIZARD.STEP3.REPORT_SCOPE_NOTE' | translate }}
            </p>
          }
          @if (heroFreeDomain(r); as hero) {
            <a class="rv-cta" [href]="reserveUrl(r.name, hero.extension, registrar())" target="_blank" rel="noopener noreferrer">
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
  @Input({ required: true }) report!: ReportLike;

  /**
   * Marque et réseaux pas encore achetés pour ce nom.
   *
   * La page reste LA MÊME : mêmes sections, même ordre, même mise en forme.
   * Seul le tiers payant est remplacé par la proposition de le débloquer.
   * C'est ce qui permet de dire « voici votre rapport, il se complète » plutôt
   * que de faire cohabiter deux écrans différents pour un même nom.
   */
  @Input() locked = false;

  /**
   * Le projet tel que l'utilisateur l'a décrit, et le cadre qu'il a posé.
   * Absent sur la page de partage publique, qui ne doit rien révéler du projet.
   */
  @Input() context: { description?: string; constraints?: { label: string; value: string }[] } | null = null;

  readonly INPI_DEPOSIT_URL = 'https://procedures.inpi.fr/?/marques/depot';
  /**
   * Les CINQ bureaux déjà câblés dans le wizard, et non trois.
   *
   * Le rapport en proposait un sous-ensemble, sans que rien ne le justifie :
   * un utilisateur qui a ses domaines chez GoDaddy n'ira pas les acheter chez
   * OVH parce qu'un rapport le lui suggère.
   */
  readonly REGISTRARS = [
    { label: 'OVH', base: 'https://www.ovhcloud.com/fr/domains/domain-name-checker/?q=' },
    { label: 'Namecheap', base: 'https://www.namecheap.com/domains/registration/results.aspx?domain=' },
    { label: 'GoDaddy', base: 'https://www.godaddy.com/domainsearch/find?domainToCheck=' },
    { label: 'Gandi', base: 'https://shop.gandi.net/fr/domain/suggest?search=' },
    { label: 'Hostinger', base: 'https://www.hostinger.com/fr/nom-de-domaine-disponible?domain=' },
  ];

  /** Bureau retenu, mémorisé : on ne rechoisit pas à chaque rapport. */
  readonly registrar = signal(this.readRegistrar());

  setRegistrar(i: string): void {
    const n = Number(i);
    if (!Number.isInteger(n) || n < 0 || n >= this.REGISTRARS.length) return;
    this.registrar.set(n);
    try { localStorage.setItem('nm-registrar', String(n)); } catch { /* stockage bloqué */ }
  }

  private readRegistrar(): number {
    try {
      const v = Number(localStorage.getItem('nm-registrar'));
      return Number.isInteger(v) && v >= 0 && v < 5 ? v : 0;
    } catch {
      return 0;
    }
  }

  reserveUrl(name: string, extension: string, i = 0): string {
    const d = `${name}.${extension}`.toLowerCase();
    return `${this.REGISTRARS[i].base}${d}&utm_source=namorama&utm_medium=referral`;
  }

  heroFreeDomain(r: ReportLike): { extension: string; domain: string } | null {
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
  summaryTone(r: ReportLike): 'ok' | 'watch' | 'risk' {
    const match = r.trademark?.match;
    if (match === 'exact') return 'risk';
    if (match === 'similar' || match === 'unknown') return 'watch';
    if (r.domains.some((d) => d.status === 'unknown')) return 'watch';
    return 'ok';
  }

  summaryKey(r: ReportLike): string {
    const t = this.summaryTone(r);
    return t === 'ok'
      ? 'WIZARD.STEP3.REPORT_SUMMARY_OK'
      : t === 'watch'
        ? 'WIZARD.STEP3.REPORT_SUMMARY_WATCH'
        : 'WIZARD.STEP3.REPORT_SUMMARY_RISK';
  }

  /** Marque officielle de X : PrimeIcons n'a que l'ancien oiseau Twitter. */
  readonly X_LOGO =
    'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

  private readonly SOCIAL_ICONS: Record<string, string> = {
    github: 'pi-github',
    linkedin: 'pi-linkedin',
    telegram: 'pi-telegram',
    tiktok: 'pi-tiktok',
    x: 'x',
    youtube: 'pi-youtube',
    instagram: 'pi-instagram',
    facebook: 'pi-facebook',
  };

  socialIcon(platform: string): string {
    return this.SOCIAL_ICONS[platform.trim().toLowerCase()] ?? 'pi-globe';
  }

  /** Appréciation d'un score, sur l'échelle de verdict du produit. */
  scoreTone(score: number): string {
    return score >= 66 ? 'free' : score >= 33 ? 'watch' : 'taken';
  }

  scoreKey(score: number): string {
    const t = this.scoreTone(score);
    return t === 'free'
      ? 'WIZARD.STEP3.SCORE_GOOD'
      : t === 'watch'
        ? 'WIZARD.STEP3.SCORE_FAIR'
        : 'WIZARD.STEP3.SCORE_WEAK';
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

  criteria(q: NameQuality): { label: string; value: number; comment?: string; tone: string }[] {
    return Object.entries(q.scores).map(([k, v]) => ({
      label: this.QUALITY_LABELS[k] ?? k,
      value: v,
      comment: q.comments?.[k],
      // Même échelle que les verdicts du produit : rien de neuf à apprendre.
      tone: v >= 4 ? 'free' : v === 3 ? 'watch' : 'taken',
    }));
  }
}

