import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Le strict nécessaire de l'API d'administration Keycloak : trouver un compte
 * par son adresse, en créer un, lui demander de choisir un mot de passe.
 *
 * Pourquoi provisionner nous-mêmes plutôt que laisser l'invité s'inscrire :
 * une inscription libre crée un compte avec l'adresse que la personne veut,
 * qui n'est pas forcément celle du partage — et le partage se rattache à
 * l'ADRESSE. L'invité aurait alors un compte, mais pas le projet.
 *
 * Tout est best-effort et journalisé : un partage doit être enregistré même
 * si Keycloak est indisponible. L'invité recevra quand même le courriel, et
 * son compte sera créé à la première connexion — au pire il lui manquera
 * l'invitation à définir son mot de passe.
 */
@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);

  constructor(private readonly config: ConfigService) {}

  private get base(): string {
    return this.config.get<string>('KEYCLOAK_AUTH_SERVER_URL') ?? '';
  }

  private get realm(): string {
    return this.config.get<string>('KEYCLOAK_REALM') ?? '';
  }

  private async token(): Promise<string | null> {
    try {
      const res = await fetch(`${this.base}/realms/${this.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.get<string>('KEYCLOAK_CLIENT_ID') ?? '',
          client_secret: this.config.get<string>('KEYCLOAK_SECRET') ?? '',
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Jeton d'administration Keycloak refusé (${res.status})`);
        return null;
      }
      return (await res.json()).access_token ?? null;
    } catch (err) {
      this.logger.warn(`Keycloak injoignable pour le jeton d'administration : ${err}`);
      return null;
    }
  }

  /**
   * S'assure qu'un compte existe pour cette adresse, et lui envoie de quoi
   * choisir son mot de passe s'il vient d'être créé.
   *
   * Retourne `true` si l'invité a un compte utilisable à la sortie —
   * l'information sert à adapter le courriel d'invitation : « connectez-vous »
   * n'a pas le même sens selon qu'un compte attend ou non.
   */
  async ensureUser(email: string, redirectUri: string): Promise<{ existait: boolean; creeMaintenant: boolean }> {
    const jeton = await this.token();
    if (!jeton) return { existait: false, creeMaintenant: false };

    const entetes = { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' };
    const url = `${this.base}/admin/realms/${this.realm}/users`;

    try {
      const existants = await fetch(`${url}?email=${encodeURIComponent(email)}&exact=true`, { headers: entetes });
      if (existants.ok) {
        const liste = await existants.json();
        if (Array.isArray(liste) && liste.length > 0) return { existait: true, creeMaintenant: false };
      }

      const creation = await fetch(url, {
        method: 'POST',
        headers: entetes,
        body: JSON.stringify({
          username: email,
          email,
          enabled: true,
          // `false` : nous n'avons pas vérifié cette adresse, c'est le
          // propriétaire du projet qui l'a saisie. Le courriel de définition du
          // mot de passe fera la vérification, puisqu'il faut l'avoir reçu.
          emailVerified: false,
          requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
        }),
      });

      if (!creation.ok) {
        this.logger.warn(`Création du compte ${email} refusée par Keycloak (${creation.status})`);
        return { existait: false, creeMaintenant: false };
      }

      const id = creation.headers.get('location')?.split('/').pop();
      if (id) await this.envoyerActions(id, jeton, redirectUri);
      return { existait: false, creeMaintenant: true };
    } catch (err) {
      this.logger.warn(`Provisionnement du compte ${email} impossible : ${err}`);
      return { existait: false, creeMaintenant: false };
    }
  }

  /**
   * Courriel Keycloak « définissez votre mot de passe ».
   *
   * C'est Keycloak qui l'envoie, avec son propre lien signé — nous ne pouvons
   * pas le fabriquer. Il faut donc que le realm ait un serveur SMTP configuré ;
   * sans lui, l'appel échoue et l'invité devra passer par « mot de passe
   * oublié ». On le journalise plutôt que de le taire.
   */
  private async envoyerActions(userId: string, jeton: string, redirectUri: string): Promise<void> {
    const clientId = this.config.get<string>('KEYCLOAK_PUBLIC_CLIENT_ID') ?? 'namorama-web';
    const url = `${this.base}/admin/realms/${this.realm}/users/${userId}/execute-actions-email`
      + `?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&lifespan=604800`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['UPDATE_PASSWORD', 'VERIFY_EMAIL']),
    });

    if (!res.ok) {
      this.logger.warn(
        `Courriel « définir le mot de passe » non envoyé (${res.status}) — le realm a-t-il un serveur SMTP ? `
        + `L'invité devra passer par « mot de passe oublié ».`,
      );
    }
  }
}
