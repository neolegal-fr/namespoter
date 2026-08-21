import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Une seule question posée à Keycloak : ce compte existe-t-il déjà ?
 *
 * NOUS NE CRÉONS PLUS LE COMPTE. C'était l'erreur de la première version : un
 * compte créé d'office n'a pas de mot de passe, et son propriétaire ne peut
 * donc pas entrer. Toute la porte reposait alors sur un SECOND courriel, celui
 * de Keycloak, avec son lien signé — deux messages pour une invitation, une
 * dépendance au SMTP du realm, et un compte fantôme dans l'annuaire pour chaque
 * invitation restée sans suite. Sans compter le pire : l'invité qui tente de
 * s'inscrire s'entend répondre que son adresse est déjà prise.
 *
 * Laisser Keycloak gérer l'inscription règle tout cela d'un coup : la personne
 * choisit son mot de passe elle-même, en une fois, sur l'écran prévu pour ça.
 * La réponse à cette question sert seulement à l'envoyer sur le bon écran —
 * connexion si le compte existe, inscription sinon.
 *
 * Best-effort : si Keycloak ne répond pas, on suppose que le compte n'existe
 * pas. Se tromper n'est pas grave — l'écran d'inscription propose « déjà un
 * compte ? », et l'écran de connexion propose « créer un compte ».
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

  /** Ce compte existe-t-il déjà dans le realm ? */
  async compteExiste(email: string): Promise<boolean> {
    const jeton = await this.token();
    if (!jeton) return false;
    try {
      const res = await fetch(
        `${this.base}/admin/realms/${this.realm}/users?email=${encodeURIComponent(email)}&exact=true`,
        { headers: { Authorization: `Bearer ${jeton}` } },
      );
      if (!res.ok) return false;
      const liste = await res.json();
      return Array.isArray(liste) && liste.length > 0;
    } catch (err) {
      this.logger.warn(`Recherche du compte ${email} impossible : ${err}`);
      return false;
    }
  }
}
