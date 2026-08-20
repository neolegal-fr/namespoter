import { Component, Input, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Menu } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';
import { AnalyticsService } from '../../services/analytics';

export interface Registrar {
  label: string;
  /** Base de l'URL de recherche, à laquelle on colle le domaine. */
  base: string;
}

/**
 * Les cinq bureaux d'enregistrement proposés, partout les mêmes.
 *
 * Ils vivaient en trois exemplaires — le wizard, le rapport, le rapport
 * partagé — dont un ne proposait qu'OVH. Un utilisateur qui a ses domaines
 * chez GoDaddy n'ira pas les acheter ailleurs parce qu'un écran l'y envoie ;
 * la liste doit donc être la même quel que soit l'endroit d'où l'on part.
 */
export const REGISTRARS: Registrar[] = [
  { label: 'OVH', base: 'https://www.ovhcloud.com/fr/domains/domain-name-checker/?q=' },
  { label: 'Namecheap', base: 'https://www.namecheap.com/domains/registration/results.aspx?domain=' },
  { label: 'GoDaddy', base: 'https://www.godaddy.com/domainsearch/find?domainToCheck=' },
  { label: 'Gandi', base: 'https://shop.gandi.net/fr/domain/suggest?search=' },
  { label: 'Hostinger', base: 'https://www.hostinger.com/fr/nom-de-domaine-disponible?domain=' },
];

/** Bureau retenu, mémorisé pour tout le produit. */
const CLE = 'nm-registrar';

function lireBureau(): number {
  try {
    const v = Number(localStorage.getItem(CLE));
    return Number.isInteger(v) && v >= 0 && v < REGISTRARS.length ? v : 0;
  } catch {
    // Prérendu, ou stockage bloqué : le premier bureau fait un défaut correct.
    return 0;
  }
}

/**
 * « Réserver » — UN bouton, et le choix du bureau dans son menu.
 *
 * Un seul composant pour toute l'application, parce que le geste est le même
 * partout : sur une ligne de domaine du rapport, en pied de rapport, sur un
 * rapport partagé, et dans l'écran « le nom retenu ». Les cinq liens alignés
 * qu'on trouvait ailleurs posaient la question « chez qui ? » avant même que
 * l'utilisateur ait dit « je réserve » — l'ordre inverse de sa décision.
 *
 * Le bureau choisi est mémorisé et se signale d'une coche à l'ouverture
 * suivante : on réserve rarement chez cinq bureaux différents.
 */
@Component({
  selector: 'app-reserver',
  standalone: true,
  imports: [CommonModule, TranslatePipe, Menu],
  template: `
    <button type="button"
            class="nm-reserve"
            [class.nm-reserve--cta]="variant === 'cta'"
            [attr.aria-label]="('WIZARD.STEP3.REPORT_RESERVE' | translate) + ' ' + (label || query)"
            (click)="ouvrir($event)">
      <i class="pi pi-shopping-cart" aria-hidden="true"></i>
      <span>{{ 'WIZARD.STEP3.REPORT_RESERVE' | translate }}<ng-container *ngIf="label"> {{ label }}</ng-container></span>
      <i class="pi pi-angle-down nm-reserve__caret" aria-hidden="true"></i>
    </button>

    <p-menu #menu [model]="items" [popup]="true" appendTo="body"></p-menu>
  `,
  styleUrl: './reserver-bouton.css',
})
export class ReserverBoutonComponent {
  /** Ce qu'on va chercher chez le bureau : « monnom.com », ou le nom seul. */
  @Input({ required: true }) query = '';
  /** Suffixe du libellé — « Réserver monnom.com » plutôt que « Réserver ». */
  @Input() label = '';
  /** `cta` : l'action principale d'un pied de page. `inline` : une ligne. */
  @Input() variant: 'inline' | 'cta' = 'inline';
  /** D'où part le clic, pour distinguer les sources dans les statistiques. */
  @Input() campaign = 'domain_search';

  private readonly analytics = inject(AnalyticsService);

  @ViewChild('menu') private menu?: Menu;
  items: MenuItem[] = [];

  readonly bureau = signal(lireBureau());

  ouvrir(event: Event): void {
    this.items = REGISTRARS.map((reg, i) => ({
      label: reg.label,
      icon: i === this.bureau() ? 'pi pi-check' : 'pi pi-external-link',
      command: () => this.aller(i),
    }));
    this.menu?.toggle(event);
  }

  private aller(i: number): void {
    this.bureau.set(i);
    try { localStorage.setItem(CLE, String(i)); } catch { /* stockage bloqué */ }
    // Dernière étape du parcours : c'est le seul endroit qui dise si le
    // produit sert à quelque chose une fois le nom trouvé.
    this.analytics.track('domain_reserve_clicked', {
      registrar: REGISTRARS[i].label,
      source: this.campaign,
    });
    const d = this.query.trim().toLowerCase();
    const url = `${REGISTRARS[i].base}${encodeURIComponent(d)}`
      + `&utm_source=namorama&utm_medium=referral&utm_campaign=${this.campaign}`;
    window.open(url, '_blank', 'noopener');
  }
}
