import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule],
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; padding: 4rem 1rem">
      <ng-container *ngIf="isSuccess()">
        <i class="pi pi-check-circle" style="font-size: 4rem; color: #16a34a"></i>
        <h1 class="font-bold text-900" style="font-size: 1.75rem; margin: 0">
          {{ 'PAYMENT.SUCCESS_TITLE' | translate }}
        </h1>
        <p class="text-500" style="margin: 0; font-size: 1rem; max-width: 28rem">
          {{ 'PAYMENT.SUCCESS_MESSAGE' | translate }}
        </p>
      </ng-container>

      <ng-container *ngIf="!isSuccess()">
        <i class="pi pi-times-circle" style="font-size: 4rem; color: #ef4444"></i>
        <h1 class="font-bold text-900" style="font-size: 1.75rem; margin: 0">
          {{ 'PAYMENT.CANCEL_TITLE' | translate }}
        </h1>
        <p class="text-500" style="margin: 0; font-size: 1rem; max-width: 28rem">
          {{ 'PAYMENT.CANCEL_MESSAGE' | translate }}
        </p>
      </ng-container>

      <p-button
        [label]="'PAYMENT.BACK_HOME' | translate"
        icon="pi pi-arrow-left"
        (onClick)="goHome()">
      </p-button>
    </div>
  `
})
export class PaymentResultComponent implements OnInit {
  isSuccess = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
  ) {}

  ngOnInit() {
    const isSuccessRoute = this.router.url.startsWith('/payment/success');
    this.isSuccess.set(isSuccessRoute);

    if (isSuccessRoute) {
      // Rafraîchir le solde de crédits après paiement réussi
      this.userService.getCredits().subscribe();
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
