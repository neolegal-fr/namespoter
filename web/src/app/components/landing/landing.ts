import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * Landing page de contenu, prérendue en HTML statique (SSG).
 *
 * Objectif SEO : fournir à Google un HTML riche en texte dès le chargement,
 * indépendamment du JavaScript. Le contenu est volontairement écrit en dur
 * (français — marché cible principal) plutôt que via ngx-translate, pour
 * garantir qu'il figure dans le HTML prérendu sans dépendre d'un chargement
 * de traductions asynchrone.
 *
 * Aucune API navigateur ici : le composant doit rester rendu côté serveur.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  template: `
    <article class="landing">
      <!-- Hero -->
      <header style="text-align: center; padding: 2rem 0 1rem">
        <h1 style="font-size: clamp(1.9rem, 5vw, 2.9rem); font-weight: 800; line-height: 1.15; margin: 0 0 1rem; color: var(--p-surface-900)">
          Trouvez le nom de marque idéal,<br />avec le domaine qui va avec
        </h1>
        <p style="font-size: 1.15rem; max-width: 42rem; margin: 0 auto 1.75rem; color: var(--p-surface-600); line-height: 1.6">
          Décrivez votre projet : l'intelligence artificielle génère des noms de marque
          originaux et <strong>vérifie en temps réel la disponibilité du nom de domaine</strong>
          via une requête Whois réelle. Trouvez le nom parfait en quelques secondes.
        </p>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem">
          <a routerLink="/app">
            <p-button label="Trouver mon nom de marque" icon="pi pi-compass" size="large" [rounded]="true"></p-button>
          </a>
          <span style="font-size: 0.9rem; color: var(--p-surface-500)">
            100 crédits offerts &middot; sans abonnement &middot; testez sans inscription
          </span>
        </div>
      </header>

      <!-- Comment ça marche -->
      <section style="margin-top: 3.5rem">
        <h2 style="font-size: 1.6rem; font-weight: 700; text-align: center; margin-bottom: 0.5rem; color: var(--p-surface-900)">
          Comment trouver un nom de marque disponible ?
        </h2>
        <p style="text-align: center; color: var(--p-surface-500); margin: 0 auto 2rem; max-width: 38rem">
          Trois étapes pour passer de l'idée au nom de domaine réservable.
        </p>
        <div class="landing-grid">
          <div class="landing-card">
            <div class="landing-step">1</div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0.75rem 0 0.5rem">Décrivez votre projet</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.55">
              Expliquez en une phrase votre produit, votre activité ou votre cible.
              L'IA reformule et comprend votre univers de marque.
            </p>
          </div>
          <div class="landing-card">
            <div class="landing-step">2</div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0.75rem 0 0.5rem">L'IA génère des noms</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.55">
              À partir de mots-clés, le générateur propose des noms de marque
              inventifs, prononçables et adaptés à votre secteur.
            </p>
          </div>
          <div class="landing-card">
            <div class="landing-step">3</div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0.75rem 0 0.5rem">Vérifiez la disponibilité</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.55">
              Chaque nom est testé en direct sur les extensions (.com, .fr, .io…)
              grâce à une vérification Whois réelle. Vous voyez immédiatement ce qui est libre.
            </p>
          </div>
        </div>
      </section>

      <!-- Pourquoi -->
      <section style="margin-top: 3.5rem">
        <h2 style="font-size: 1.6rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--p-surface-900)">
          Pourquoi utiliser Namorama
        </h2>
        <div class="landing-grid">
          <div class="landing-feature">
            <i class="pi pi-bolt" style="font-size: 1.5rem; color: var(--p-primary-color)"></i>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0.5rem 0 0.35rem">Disponibilité réelle, pas une estimation</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              Vérification Whois en direct : un domaine affiché comme libre est réellement réservable.
            </p>
          </div>
          <div class="landing-feature">
            <i class="pi pi-sparkles" style="font-size: 1.5rem; color: var(--p-primary-color)"></i>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0.5rem 0 0.35rem">Des idées vraiment originales</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              L'IA explore des combinaisons que vous n'auriez pas imaginées, au-delà des noms déjà pris.
            </p>
          </div>
          <div class="landing-feature">
            <i class="pi pi-wallet" style="font-size: 1.5rem; color: var(--p-primary-color)"></i>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0.5rem 0 0.35rem">Sans abonnement</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              100 crédits gratuits chaque mois, puis des packs simples. Vous ne payez que ce que vous utilisez.
            </p>
          </div>
          <div class="landing-feature">
            <i class="pi pi-table" style="font-size: 1.5rem; color: var(--p-primary-color)"></i>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0.5rem 0 0.35rem">Vue par extension</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              Un tableau clair compare chaque nom sur toutes les extensions de domaine d'un coup d'œil.
            </p>
          </div>
        </div>
      </section>

      <!-- Pour qui -->
      <section style="margin-top: 3.5rem; text-align: center">
        <h2 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 1rem; color: var(--p-surface-900)">
          Pour quels projets ?
        </h2>
        <p style="max-width: 44rem; margin: 0 auto; color: var(--p-surface-600); line-height: 1.65">
          Que vous lanciez une <strong>startup</strong>, une <strong>boutique e-commerce</strong>,
          un <strong>restaurant</strong>, une <strong>application mobile</strong>, un cabinet de
          <strong>conseil</strong> ou une marque de <strong>cosmétiques</strong>, Namorama vous aide
          à trouver un nom mémorable dont le nom de domaine est encore libre. Idéal pour
          choisir un nom de startup, nommer un nouveau produit ou rebrander une activité existante.
        </p>
      </section>

      <!-- FAQ -->
      <section style="margin-top: 3.5rem">
        <h2 style="font-size: 1.6rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--p-surface-900)">
          Questions fréquentes
        </h2>
        <div style="max-width: 44rem; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 0.4rem">Comment trouver un nom de domaine disponible ?</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.55">
              Décrivez votre projet sur Namorama : l'IA propose des noms de marque et teste
              automatiquement leur disponibilité en domaine via une requête Whois. Les noms libres
              sont affichés instantanément, prêts à être réservés chez votre registrar.
            </p>
          </div>
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 0.4rem">Le service est-il gratuit ?</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.55">
              Oui pour démarrer : vous disposez de 100 crédits gratuits chaque mois, sans abonnement.
              Une suggestion de domaine coûte 1 crédit. Des packs sans engagement sont disponibles ensuite.
            </p>
          </div>
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 0.4rem">La disponibilité affichée est-elle fiable ?</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.55">
              Oui. Contrairement aux générateurs qui se contentent d'estimer, Namorama interroge
              le registre Whois en temps réel. Un domaine indiqué comme disponible l'est réellement
              au moment de la recherche.
            </p>
          </div>
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 0.4rem">Quelles extensions de domaine sont vérifiées ?</h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.55">
              Les extensions les plus courantes comme .com, .fr, .io, .co ou .net, ainsi que d'autres
              que vous pouvez ajouter selon votre projet. Le résultat s'affiche sous forme de tableau comparatif.
            </p>
          </div>
        </div>
      </section>

      <!-- Ressources / liens internes SEO -->
      <section style="margin-top: 3.5rem">
        <h2 style="font-size: 1.6rem; font-weight: 700; text-align: center; margin-bottom: 0.5rem; color: var(--p-surface-900)">
          Guides : trouver un nom et son domaine
        </h2>
        <p style="text-align: center; color: var(--p-surface-500); margin: 0 auto 2rem; max-width: 38rem">
          Marque, entreprise, produit, startup — la méthode pour chaque projet.
          <a routerLink="/guides" style="color: var(--p-primary-600)">Voir tous les guides</a>.
        </p>
        <div class="landing-grid" style="max-width: 44rem; margin: 0 auto">
          <a routerLink="/guides/trouver-nom-de-marque" class="landing-card" style="text-decoration: none; color: inherit; display: block">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 0.4rem; color: var(--p-surface-900)">
              Trouver un nom de marque
            </h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              La méthode en 5 étapes pour un nom mémorable dont le domaine est encore libre.
            </p>
          </a>
          <a routerLink="/guides/trouver-nom-entreprise" class="landing-card" style="text-decoration: none; color: inherit; display: block">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 0.4rem; color: var(--p-surface-900)">
              Trouver un nom d'entreprise
            </h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              Un nom solide, libre au registre (INPI/RCS) et disponible en domaine.
            </p>
          </a>
          <a routerLink="/guides/trouver-nom-de-produit" class="landing-card" style="text-decoration: none; color: inherit; display: block">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 0.4rem; color: var(--p-surface-900)">
              Trouver un nom de produit
            </h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              Descriptif, évocateur ou inventé : nommer un produit qui marque les esprits.
            </p>
          </a>
          <a routerLink="/guides/trouver-nom-de-startup" class="landing-card" style="text-decoration: none; color: inherit; display: block">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 0.4rem; color: var(--p-surface-900)">
              Trouver un nom de startup
            </h3>
            <p style="margin: 0; color: var(--p-surface-600); line-height: 1.5">
              Court, brandable, disponible en .com / .io / .ai dès le premier jour.
            </p>
          </a>
        </div>
      </section>

      <!-- CTA final -->
      <section style="margin: 4rem 0 2rem; text-align: center">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--p-surface-900)">
          Prêt à trouver le nom de votre marque ?
        </h2>
        <a routerLink="/app">
          <p-button label="Lancer une recherche gratuite" icon="pi pi-arrow-right" iconPos="right" size="large" [rounded]="true"></p-button>
        </a>
      </section>
    </article>
  `,
  styles: [`
    .landing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .landing-card,
    .landing-feature {
      background: var(--p-surface-0, #fff);
      border: 1px solid var(--p-surface-200);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    .landing-step {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 999px;
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
  `],
})
export class LandingComponent {}
