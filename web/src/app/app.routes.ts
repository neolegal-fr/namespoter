import { Routes } from '@angular/router';
import { WizardComponent } from './components/wizard/wizard';
import { PaymentResultComponent } from './components/payment-result/payment-result';

export const routes: Routes = [
  { path: '', component: WizardComponent },
  { path: 'projects/:id', component: WizardComponent },
  { path: 'payment/success', component: PaymentResultComponent },
  { path: 'payment/cancel', component: PaymentResultComponent },
  { path: '**', redirectTo: '' }
];
