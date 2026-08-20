import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * Bloc d'appel à l'action réutilisé en fin (et en milieu) d'article de contenu.
 * Renvoie systématiquement vers le wizard de recherche (/app), objectif de
 * conversion de chaque page SEO.
 */
@Component({
  selector: 'app-article-cta',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  template: `
    <aside style="margin: 3rem 0; padding: 2rem 1.5rem; text-align: center; background: var(--p-primary-50, #ecfdf5); border: 1px solid var(--p-primary-200, #a7f3d0); border-radius: 0.9rem">
      <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.5rem; color: var(--p-surface-900)">{{ heading }}</h2>
      <p style="margin: 0 auto 1.25rem; max-width: 34rem; color: var(--p-surface-600); line-height: 1.55">{{ subheading }}</p>
      <!-- « inline-block » : le lien enveloppe le bouton, mais en ligne sa boîte
           se réduit à une ligne de texte de 20 px — la cible visible et la
           cible mesurée cessent de coïncider. -->
      <a routerLink="/app" style="display: inline-block">
        <p-button [label]="label" icon="pi pi-compass" size="large" [rounded]="true"></p-button>
      </a>
      <div style="margin-top: 0.6rem; font-size: 0.85rem; color: var(--p-surface-500)">
        100 crédits offerts &middot; sans abonnement &middot; testez sans inscription
      </div>
    </aside>
  `,
})
export class ArticleCtaComponent {
  @Input() heading = 'Trouvez le nom de votre marque maintenant';
  @Input() subheading = "Décrivez votre projet, l'IA propose des noms et vérifie la disponibilité du domaine en temps réel.";
  @Input() label = 'Lancer une recherche gratuite';
}
