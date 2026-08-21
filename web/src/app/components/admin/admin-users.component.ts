import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AdminService, AdminUser } from '../../services/admin.service';
import { UserService } from '../../services/user';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslatePipe,
    TableModule, ButtonModule, InputTextModule,
    InputNumberModule, ToastModule, TooltipModule,
    ConfirmDialog,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmdialog></p-confirmdialog>

    <div style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem">

      <input pInputText [(ngModel)]="searchText" [placeholder]="'ADMIN.SEARCH_PLACEHOLDER' | translate"
             (ngModelChange)="onSearch()" style="max-width: 24rem">

      <div class="border-1 border-solid border-round-lg shadow-1 overflow-x-auto" style="background: white">
        <!-- « lazy » : le tri part au SERVEUR. La table étant paginée, trier les
             vingt lignes chargées répondrait à « qui est le plus récemment
             actif de cette page », pas de la base. -->
        <p-table [value]="users()" [loading]="loadingUsers()" [tableStyle]="{'width': '100%'}"
                 styleClass="p-datatable-sm"
                 [lazy]="true" [sortField]="sortField()" [sortOrder]="sortOrder()"
                 (onLazyLoad)="onSort($any($event))">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name" style="background: var(--p-surface-50)">
                {{ 'ADMIN.COL_NAME' | translate }} <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th pSortableColumn="email" style="background: var(--p-surface-50)">
                {{ 'ADMIN.COL_EMAIL' | translate }} <p-sortIcon field="email"></p-sortIcon>
              </th>
              <th pSortableColumn="totalCredits" class="text-center" style="background: var(--p-surface-50); white-space: nowrap">
                {{ 'ADMIN.COL_CREDITS' | translate }} <p-sortIcon field="totalCredits"></p-sortIcon>
              </th>
              <th pSortableColumn="projectCount" class="text-center" style="background: var(--p-surface-50); white-space: nowrap">
                {{ 'ADMIN.COL_PROJECTS' | translate }} <p-sortIcon field="projectCount"></p-sortIcon>
              </th>
              <th pSortableColumn="brandReportCount" class="text-center" style="background: var(--p-surface-50); white-space: nowrap">
                {{ 'ADMIN.COL_REPORTS' | translate }} <p-sortIcon field="brandReportCount"></p-sortIcon>
              </th>
              <th pSortableColumn="createdAt" class="text-center" style="background: var(--p-surface-50); white-space: nowrap">
                {{ 'ADMIN.COL_CREATED' | translate }} <p-sortIcon field="createdAt"></p-sortIcon>
              </th>
              <!-- « Dernière activité », et non « dernière connexion » : le champ
                   est réécrit à CHAQUE appel authentifié de l'API, pas seulement
                   à l'ouverture de session. Il dit donc quand le compte s'est
                   servi du produit pour la dernière fois — ce qu'on cherche
                   vraiment en triant cette colonne. -->
              <th pSortableColumn="lastLogin" class="text-center" style="background: var(--p-surface-50); white-space: nowrap">
                {{ 'ADMIN.COL_LAST_LOGIN' | translate }} <p-sortIcon field="lastLogin"></p-sortIcon>
              </th>
              <th style="background: var(--p-surface-50); width: 1px"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr>
              <td class="text-sm font-semibold text-900">
                {{ (user.firstName || user.lastName) ? (user.firstName + ' ' + user.lastName) : '—' }}
              </td>
              <td class="text-xs text-500" style="font-family: monospace">
                {{ user.email || user.keycloakId }}
              </td>
              <td class="text-center">
                <span class="font-bold" [style.color]="user.totalCredits > 0 ? '#16a34a' : '#ef4444'">{{ user.totalCredits }}</span>
                <span class="text-400 text-xs" style="margin-left: 0.25rem">({{ user.credits }}+{{ user.extraCredits }})</span>
              </td>
              <td class="text-center text-sm">{{ user.projectCount }}</td>
              <td class="text-center text-sm" [class.text-400]="!user.brandReportCount">{{ user.brandReportCount }}</td>
              <td class="text-center text-xs text-500">{{ user.createdAt | date:'dd/MM/yy' }}</td>
              <td class="text-center text-xs text-500">{{ user.lastLogin ? (user.lastLogin | date:'dd/MM/yy') : '—' }}</td>
              <td style="white-space: nowrap; padding: 0.25rem 0.5rem">
                <ng-container *ngIf="editingUserId() === user.id; else showEditBtn">
                  <div style="display: flex; gap: 0.375rem; align-items: center; flex-wrap: wrap">
                    <div style="display: flex; flex-direction: column; gap: 0.15rem">
                      <span style="font-size: 0.68rem; color: var(--p-surface-400); text-transform: uppercase; letter-spacing: 0.04em">{{ 'ADMIN.EXTRA_CREDITS' | translate }}</span>
                      <p-inputNumber [(ngModel)]="adjustNewValue" [showButtons]="false" [min]="0"
                                     [style]="{'width': '6rem'}" inputStyleClass="text-center p-1 text-sm">
                      </p-inputNumber>
                    </div>
                    <p-button icon="pi pi-check" size="small" severity="success"
                              [loading]="savingUserId() === user.id"
                              (onClick)="saveAdjustment(user)">
                    </p-button>
                    <p-button icon="pi pi-times" size="small" severity="secondary"
                              (onClick)="cancelEdit()">
                    </p-button>
                  </div>
                </ng-container>
                <ng-template #showEditBtn>
                  <p-button icon="pi pi-wallet" size="small" [text]="true" severity="secondary"
                            [pTooltip]="'ADMIN.ADJUST_CREDITS' | translate" tooltipPosition="top"
                            (onClick)="startEdit(user)">
                  </p-button>
                  <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger"
                            [loading]="deletingUserId() === user.id"
                            [disabled]="user.keycloakId === currentKeycloakId()"
                            pTooltip="Supprimer l'utilisateur" tooltipPosition="top"
                            (onClick)="confirmDeleteUser(user)">
                  </p-button>
                </ng-template>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8" class="text-center text-500 py-4">{{ 'ADMIN.NO_USERS' | translate }}</td></tr>
          </ng-template>
        </p-table>

        <div *ngIf="total() > pageSize" style="display: flex; justify-content: space-between; align-items: center; padding: 0.625rem 1rem; border-top: 1px solid var(--p-surface-200)">
          <span class="text-500 text-sm">{{ total() }} {{ 'ADMIN.USERS_TOTAL' | translate }}</span>
          <div style="display: flex; gap: 0.375rem">
            <p-button icon="pi pi-chevron-left" size="small" severity="secondary" [text]="true"
                      [disabled]="page() === 1" (onClick)="changePage(page() - 1)">
            </p-button>
            <span class="text-sm" style="padding: 0.25rem 0.5rem">{{ page() }} / {{ totalPages() }}</span>
            <p-button icon="pi pi-chevron-right" size="small" severity="secondary" [text]="true"
                      [disabled]="page() === totalPages()" (onClick)="changePage(page() + 1)">
            </p-button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  loadingUsers = signal(false);
  total = signal(0);
  page = signal(1);
  pageSize = 20;
  searchText = '';
  private searchTimer: any;

  /**
   * Tri courant. Par défaut la date d'inscription, décroissante — l'ordre
   * historique de cette liste, conservé pour ne pas déplacer les repères de
   * qui l'utilise déjà.
   */
  readonly sortField = signal('createdAt');
  readonly sortOrder = signal(-1);

  editingUserId = signal<number | null>(null);
  savingUserId = signal<number | null>(null);
  deletingUserId = signal<number | null>(null);
  currentKeycloakId = signal<string | null>(null);
  adjustNewValue = 0;
  adjustReason = '';

  constructor(
    private adminService: AdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private keycloak: KeycloakService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.keycloak.loadUserProfile().then(p => this.currentKeycloakId.set((p as any).id ?? null));
    this.loadUsers();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    this.adminService
      .getUsers(
        this.page(),
        this.pageSize,
        this.searchText,
        this.sortField(),
        this.sortOrder() === 1 ? 'ASC' : 'DESC',
      )
      .subscribe({
      next: ({ data, total }) => {
        this.users.set(data);
        this.total.set(total);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });
  }

  /**
   * Clic sur un en-tête.
   *
   * `onLazyLoad` se déclenche AUSSI à l'initialisation de la table, avec le
   * tri qu'on vient de lui donner : sans la comparaison ci-dessous, chaque
   * ouverture de l'écran lancerait deux fois la même requête. Le retour à la
   * première page est volontaire — trier puis rester page 3 montre le milieu
   * d'un classement qu'on vient tout juste de demander.
   */
  onSort(e: { sortField?: string | string[] | null; sortOrder?: number | null }): void {
    const champ = (Array.isArray(e.sortField) ? e.sortField[0] : e.sortField) || 'createdAt';
    const sens = e.sortOrder ?? -1;
    if (champ === this.sortField() && sens === this.sortOrder()) return;
    this.sortField.set(champ);
    this.sortOrder.set(sens);
    this.page.set(1);
    this.loadUsers();
  }

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.loadUsers(); }, 300);
  }

  changePage(p: number) {
    this.page.set(p);
    this.loadUsers();
  }

  startEdit(user: AdminUser) {
    this.editingUserId.set(user.id);
    this.adjustNewValue = user.extraCredits;
    this.adjustReason = '';
  }

  cancelEdit() {
    this.editingUserId.set(null);
  }

  confirmDeleteUser(user: AdminUser) {
    const label = user.email || user.keycloakId;
    this.confirmationService.confirm({
      message: `Supprimer définitivement l'utilisateur <strong>${label}</strong> ?<br>Ses projets seront également supprimés.`,
      header: 'Supprimer l\'utilisateur',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteUser(user),
    });
  }

  deleteUser(user: AdminUser) {
    this.deletingUserId.set(user.id);
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== user.id));
        this.total.update(t => t - 1);
        this.deletingUserId.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Utilisateur supprimé',
          detail: user.email || user.keycloakId,
        });
      },
      error: () => this.deletingUserId.set(null),
    });
  }

  saveAdjustment(user: AdminUser) {
    const delta = this.adjustNewValue - user.extraCredits;
    this.savingUserId.set(user.id);
    this.adminService.adjustCredits(user.id, delta, this.adjustReason).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.savingUserId.set(null);
        this.editingUserId.set(null);
        // Si on vient d'ajuster ses propres crédits, rafraîchir le compteur global.
        if (updated.keycloakId === this.currentKeycloakId()) {
          this.userService.getCredits().subscribe();
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Crédits mis à jour',
          detail: `${updated.email || updated.keycloakId} : ${updated.totalCredits} crédits (${delta >= 0 ? '+' : ''}${delta})`,
        });
      },
      error: () => this.savingUserId.set(null),
    });
  }
}
