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
import { ComparatifNamelixComponent } from './components/content/comparatif-namelix';
import { ComparatifLookaComponent } from './components/content/comparatif-looka';
import { GuidesIndexComponent } from './components/content/guides-index';
import { GuideNomEntrepriseComponent } from './components/content/guide-nom-entreprise';
import { GuideNomDeProduitComponent } from './components/content/guide-nom-de-produit';
import { GuideNomDeStartupComponent } from './components/content/guide-nom-de-startup';
import { GenerateurNomStartupIaComponent } from './components/content/generateur-nom-startup-ia';
import { GenerateurNomEcommerceComponent } from './components/content/generateur-nom-ecommerce';
import { GenerateurNomSaasComponent } from './components/content/generateur-nom-saas';
import { GenerateurNomProduitComponent } from './components/content/generateur-nom-produit';
import { GenerateurNomMarqueCosmetiqueComponent } from './components/content/generateur-nom-marque-cosmetique';
import { NomCourtInventeComponent } from './components/content/nom-court-invente';
import { VerifierDisponibiliteMarqueComponent } from './components/content/verifier-disponibilite-nom-de-marque';
import { RapportPartageComponent } from './components/content/rapport-partage';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  // Accueil en anglais : même composant, langue tirée de l'URL. Seule page à
  // avoir une version anglaise réelle — les guides restent en français et
  // n'ont donc pas de `/en/` (ce serait du contenu dupliqué).
  { path: 'en', component: LandingComponent },
  { path: 'guides', component: GuidesIndexComponent },
  { path: 'guides/trouver-nom-de-marque', component: GuideNomDeMarqueComponent },
  { path: 'guides/trouver-nom-entreprise', component: GuideNomEntrepriseComponent },
  { path: 'guides/trouver-nom-de-produit', component: GuideNomDeProduitComponent },
  { path: 'guides/trouver-nom-de-startup', component: GuideNomDeStartupComponent },
  { path: 'generateur-nom-startup-ia', component: GenerateurNomStartupIaComponent },
  { path: 'generateur-nom-ecommerce', component: GenerateurNomEcommerceComponent },
  { path: 'generateur-nom-saas', component: GenerateurNomSaasComponent },
  { path: 'generateur-nom-de-produit', component: GenerateurNomProduitComponent },
  { path: 'generateur-nom-marque-cosmetique', component: GenerateurNomMarqueCosmetiqueComponent },
  { path: 'nom-de-startup-court-invente', component: NomCourtInventeComponent },
  { path: 'verifier-disponibilite-nom-de-marque', component: VerifierDisponibiliteMarqueComponent },
  { path: 'rapport/:token', component: RapportPartageComponent },
  { path: 'comparatif-generateurs-de-noms', component: ComparatifGenerateursComponent },
  { path: 'namorama-vs-namelix', component: ComparatifNamelixComponent },
  { path: 'namorama-vs-looka', component: ComparatifLookaComponent },
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
