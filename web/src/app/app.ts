import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { UserService } from './services/user';
import { ProjectService } from './services/project';
import { KeycloakService } from 'keycloak-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';

import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    TranslateModule, 
    MenuModule, 
    ButtonModule, 
    MenubarModule, 
    AvatarModule,
    SelectModule,
    FormsModule,
    Dialog,
    InputNumber
  ],
  template: `
    <main class="min-h-screen bg-gray-50 font-sans">
      <p-menubar styleClass="border-0 border-b border-surface bg-surface-0 px-4 md:px-8 h-16 sticky top-0 z-50">
        <ng-template pTemplate="start">
          <div class="flex items-center gap-2 cursor-pointer" (click)="goToHome()">
            <i class="pi pi-compass text-2xl text-primary"></i>
            <span class="text-xl font-bold tracking-tight text-surface-900">NameSpotter</span>
          </div>
        </ng-template>

        <ng-template pTemplate="end">
          <div class="flex items-center gap-2 md:gap-4">
            
            <!-- Langue Dropdown Compact -->
            <p-select 
              [options]="languages" 
              [(ngModel)]="selectedLang" 
              optionValue="code"
              (onChange)="onLangChange($event)"
              styleClass="w-16 border-none bg-transparent"
              [selectOnFocus]="true">
              <ng-template pTemplate="selectedItem" let-selectedOption>
                <div class="flex items-center justify-center">
                  <span [class]="'fi fi-' + selectedOption.flag + ' text-lg'"></span>
                </div>
              </ng-template>
              <ng-template pTemplate="item" let-lang>
                <div class="flex items-center gap-2">
                  <span [class]="'fi fi-' + lang.flag"></span>
                  <span class="text-xs font-bold">{{ lang.label }}</span>
                </div>
              </ng-template>
            </p-select>

            <ng-container *ngIf="isLoggedIn()">
              <p-button 
                [label]="'APP.MY_PROJECTS' | translate" 
                icon="pi pi-folder" 
                [text]="true"
                severity="secondary"
                (onClick)="openProjects()">
              </p-button>

              <p-avatar 
                icon="pi pi-user" 
                shape="circle" 
                class="cursor-pointer ml-2"
                styleClass="bg-primary text-primary-contrast shadow-sm"
                (click)="userMenu.toggle($event)">
              </p-avatar>
              <p-menu #userMenu [model]="profileMenuItems" [popup]="true" appendTo="body"></p-menu>
            </ng-container>

            <p-button 
              *ngIf="!isLoggedIn()" 
              [label]="'APP.LOGIN' | translate" 
              icon="pi pi-sign-in"
              [rounded]="true"
              (onClick)="login()">
            </p-button>
          </div>
        </ng-template>
      </p-menubar>
      
      <div class="flex flex-col items-center w-full px-4 py-4 md:py-8">
        <div class="w-full max-w-4xl">
          <router-outlet></router-outlet>
        </div>
      </div>

      <!-- Dialogue de demande de crédits (Global) -->
      <p-dialog [header]="'WIZARD.CREDIT_DIALOG.TITLE' | translate" [visible]="projectService.showCreditDialog()" (visibleChange)="projectService.showCreditDialog.set($event)" [modal]="true" [style]="{ width: '25rem' }" [appendTo]="'body'">
        <span class="p-text-secondary block mb-5">{{ 'WIZARD.CREDIT_DIALOG.MESSAGE' | translate }}</span>
        <div class="flex items-center gap-3 mb-5">
            <label for="credits" class="font-semibold w-24">{{ 'WIZARD.CREDIT_DIALOG.QUANTITY' | translate }}</label>
            <p-inputNumber [(ngModel)]="creditsToBuy" inputId="credits" class="flex-auto" [min]="1"></p-inputNumber>
        </div>
        <div class="flex justify-end gap-2">
            <p-button [label]="'WIZARD.CREDIT_DIALOG.CANCEL' | translate" severity="secondary" (onClick)="projectService.showCreditDialog.set(false)" />
            <p-button [label]="'WIZARD.CREDIT_DIALOG.BUY' | translate" (onClick)="buyCredits()" />
        </div>
      </p-dialog>

      <footer class="mt-20 py-12 border-t bg-white text-center text-gray-400 text-sm">
        <div class="mb-2 font-bold text-gray-500">NameSpotter &copy; 2026</div>
        {{ 'APP.FOOTER' | translate }}
      </footer>
    </main>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'namespoter-web';
  credits = signal(0);
  isLoggedIn = signal(false);
  currentLang = signal('fr');
  selectedLang = 'fr';
  userName = signal('');
  creditsToBuy = signal(100);
  
  languages = [
    { label: 'FR', code: 'fr', flag: 'fr' },
    { label: 'EN', code: 'en', flag: 'gb' }
  ];

  profileMenuItems: MenuItem[] = [];

  constructor(
    private userService: UserService,
    public projectService: ProjectService,
    private keycloak: KeycloakService,
    private translate: TranslateService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.isLoggedIn.set(await this.keycloak.isLoggedIn());
    const lang = this.translate.currentLang || 'fr';
    this.currentLang.set(lang);
    this.selectedLang = lang;
    
    if (this.isLoggedIn()) {
      const profile = await this.keycloak.loadUserProfile();
      this.userName.set(profile.firstName || profile.username || '');
      this.loadCredits(); // Forcer le chargement initial des crédits
      this.updateProfileMenu();
    }

    this.translate.onLangChange.subscribe(() => {
      this.updateProfileMenu();
    });

    this.userService.credits$.subscribe(val => {
      this.credits.set(val);
      this.updateProfileMenu();
    });
  }

  updateProfileMenu() {
    this.translate.get(['APP.CREDITS', 'APP.LOGOUT', 'APP.MANAGE_ACCOUNT']).subscribe(res => {
      this.profileMenuItems = [
        {
          label: this.userName(),
          items: [
            {
              label: `${res['APP.CREDITS']}: ${this.credits()}`,
              icon: 'pi pi-wallet',
              command: () => {
                this.projectService.showCreditDialog.set(true);
              }
            },
            {
              label: res['APP.MANAGE_ACCOUNT'],
              icon: 'pi pi-cog',
              command: () => this.keycloak.getKeycloakInstance().accountManagement()
            },
            { separator: true },
            {
              label: res['APP.LOGOUT'],
              icon: 'pi pi-sign-out',
              command: () => this.logout()
            }
          ]
        }
      ];
    });
  }

  setLang(lang: string) {
    this.translate.use(lang);
    this.currentLang.set(lang);
    this.selectedLang = lang;
  }

  onLangChange(event: any) {
    this.setLang(event.value);
  }

  loadCredits() {
    this.userService.getCredits().subscribe();
  }

  buyCredits() {
    console.log('Requesting credits:', this.creditsToBuy());
    this.userService.addCredits(this.creditsToBuy()).subscribe(() => {
      this.projectService.showCreditDialog.set(false);
      console.log('Credits updated successfully');
    });
  }

  openProjects() {
    this.projectService.refreshProjects().subscribe();
    this.projectService.showDrawer.set(true);
  }

  login() {
    this.keycloak.login();
  }

  logout() {
    this.keycloak.logout(window.location.origin);
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  reload() {
    window.location.reload();
  }
}