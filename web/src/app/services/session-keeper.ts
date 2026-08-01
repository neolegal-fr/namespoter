import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

/**
 * Maintient la session Keycloak vivante tant que l'onglet est utilisé.
 *
 * Sans ça, le jeton d'accès (5 min) n'est renouvelé qu'au moment d'un appel API :
 * un utilisateur qui réfléchit à ses mots-clés pendant un quart d'heure laisse la
 * session filer vers le timeout d'inactivité et se retrouve déconnecté à l'action
 * suivante. On renouvelle donc périodiquement, ce qui remet aussi à zéro le
 * compteur d'inactivité côté Keycloak.
 *
 * L'onglet en arrière-plan ne renouvelle rien (inutile de tenir une session pour
 * un onglet oublié) : le retour au premier plan déclenche un renouvellement
 * immédiat, de même que le retour du réseau.
 */
@Injectable({ providedIn: 'root' })
export class SessionKeeperService {
  /** Fréquence de renouvellement — bien en deçà de la durée de vie du jeton (5 min). */
  private readonly REFRESH_INTERVAL_MS = 60_000;
  /** On renouvelle si le jeton expire dans moins de 2 minutes. */
  private readonly MIN_VALIDITY_S = 120;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private keycloak: KeycloakService) {}

  /** Démarre la surveillance (idempotent, navigateur uniquement). */
  start(): void {
    if (this.timer !== null || typeof window === 'undefined') return;

    this.timer = setInterval(() => this.refresh(), this.REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refresh();
    });
    window.addEventListener('online', () => this.refresh());
  }

  private async refresh(): Promise<void> {
    if (document.hidden) return;
    try {
      if (!(await this.keycloak.isLoggedIn())) return;
      await this.keycloak.updateToken(this.MIN_VALIDITY_S);
    } catch {
      // Session expirée ou Keycloak injoignable : on ne force pas de redirection,
      // l'utilisateur sera invité à se reconnecter lors de sa prochaine action.
    }
  }
}
