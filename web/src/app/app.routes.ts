import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing';
import { WizardComponent } from './components/wizard/wizard';
import { PaymentResultComponent } from './components/payment-result/payment-result';
import { AdminComponent } from './components/admin/admin.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users.component';
import { AdminFeedbackComponent } from './components/admin/admin-feedback.component';
import { LegalComponent } from './components/legal/legal.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { GuideNomDeMarqueComponent } from './components/content/guide-nom-de-marque';
import { ComparatifGenerateursComponent } from './components/content/comparatif-generateurs';
import { GuidesIndexComponent } from './components/content/guides-index';
import { GuideNomEntrepriseComponent } from './components/content/guide-nom-entreprise';
import { GuideNomDeProduitComponent } from './components/content/guide-nom-de-produit';
import { GuideNomDeStartupComponent } from './components/content/guide-nom-de-startup';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'guides', component: GuidesIndexComponent },
  { path: 'guides/trouver-nom-de-marque', component: GuideNomDeMarqueComponent },
  { path: 'guides/trouver-nom-entreprise', component: GuideNomEntrepriseComponent },
  { path: 'guides/trouver-nom-de-produit', component: GuideNomDeProduitComponent },
  { path: 'guides/trouver-nom-de-startup', component: GuideNomDeStartupComponent },
  { path: 'comparatif-generateurs-de-noms', component: ComparatifGenerateursComponent },
  { path: 'app', component: WizardComponent },
  { path: 'projects/:id', component: WizardComponent },
  { path: 'payment/success', component: PaymentResultComponent },
  { path: 'payment/cancel', component: PaymentResultComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'feedback', component: AdminFeedbackComponent },
    ],
  },
  { path: 'legal', component: LegalComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: '**', redirectTo: '' }
];
