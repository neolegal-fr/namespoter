import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Request } from 'express';

/** Les étapes que peut franchir une visite, après son premier affichage. */
export type EtapeVisite = 'recherche' | 'compte' | 'rapport';

/** Colonne portant chaque étape. Une seule table de correspondance, pour éviter le SQL en chaîne. */
const COLONNE: Record<EtapeVisite, string> = {
  recherche: 'searched',
  compte: 'accountCreated',
  rapport: 'reportRequested',
};

/**
 * Identifiant de session tel qu'il arrive du navigateur.
 *
 * Filtré, parce qu'il finit en clé primaire : un en-tête est écrit par le
 * client, et rien n'oblige un client à envoyer un UUID. Le format accepté est
 * celui que produit `crypto.randomUUID()`, élargi aux identifiants de repli.
 */
const FORMAT_SESSION = /^[A-Za-z0-9_-]{8,64}$/;

/** Lit l'identifiant de session posé par l'intercepteur du front. */
export function sessionIdDeLaRequete(req: Request): string | undefined {
  const brut = req.headers['x-session-id'];
  const valeur = Array.isArray(brut) ? brut[0] : brut;
  return valeur && FORMAT_SESSION.test(valeur) ? valeur : undefined;
}

/**
 * Journal des visites : le dénominateur du tableau de bord.
 *
 * Deux entrées, et une seule table :
 *
 * - `visite()` — appelée par `POST /events` au premier affichage d'une page,
 *   sans jeton ni cookie. C'est la seule mesure qui voie ceux qui repartent ;
 * - `marquer()` — appelée par les contrôleurs authentifiés au moment où
 *   l'étape est réellement franchie. Le `sub` y est celui du jeton, pas une
 *   valeur déclarée par le navigateur : c'est ce qui permet d'écarter les
 *   comptes internes sans faire confiance au client.
 *
 * Best-effort de bout en bout, comme les logs : une statistique qui ne s'écrit
 * pas ne doit jamais faire échouer la requête qui la portait.
 */
@Injectable()
export class FunnelService {
  private readonly logger = new Logger(FunnelService.name);

  /**
   * Étapes déjà écrites par CE processus, par session.
   *
   * `marquer('recherche')` part à chaque recherche, `marquer('compte')` à
   * chaque appel de `/users/me` : sans ce garde, une visite active
   * déclencherait un UPDATE par clic pour réécrire un drapeau déjà levé. La
   * base reste la référence — ce cache n'évite que le trajet.
   *
   * Borné : au-delà de MAX_SESSIONS, on repart de zéro. Une entrée oubliée
   * coûte un UPDATE inutile, pas une donnée fausse.
   */
  private ecrites = new Map<string, Set<EtapeVisite | 'visite' | 'lien'>>();
  private static readonly MAX_SESSIONS = 5000;

  constructor(private readonly dataSource: DataSource) {}

  private dejaEcrit(sessionId: string, quoi: EtapeVisite | 'visite' | 'lien'): boolean {
    const vues = this.ecrites.get(sessionId);
    if (vues?.has(quoi)) return true;
    if (this.ecrites.size >= FunnelService.MAX_SESSIONS) this.ecrites.clear();
    if (vues) vues.add(quoi);
    else this.ecrites.set(sessionId, new Set([quoi]));
    return false;
  }

  /**
   * Enregistre une visite. Idempotent : la première page affichée fait foi.
   *
   * `connecte` dit si la session est arrivée avec un compte ouvert. La valeur
   * ne s'écrase pas ensuite : une session qui se connecte en cours de route
   * reste une visite arrivée sans compte, ce qui est justement l'information.
   */
  async visite(sessionId: string | undefined, connecte = false): Promise<void> {
    if (!sessionId || !FORMAT_SESSION.test(sessionId)) return;
    if (this.dejaEcrit(sessionId, 'visite')) return;
    await this.ecrire(
      `INSERT INTO visitor_session (sessionId, firstSeenAt, loggedInAtStart)
       VALUES (?, NOW(), ?)
       ON DUPLICATE KEY UPDATE sessionId = sessionId`,
      [sessionId, connecte ? 1 : 0],
    );
  }

  /**
   * Marque une étape franchie, en créant la visite si elle manque.
   *
   * Le repli de création compte : une balise `sendBeacon` peut être bloquée par
   * une extension du navigateur là où l'appel métier, lui, passe forcément. La
   * visite existerait alors dans les faits sans exister dans la table, et
   * l'entonnoir afficherait plus d'étapes que de visiteurs.
   *
   * Dans ce repli, `loggedInAtStart` vaut 1 sauf pour la création de compte :
   * une recherche et un rapport supposent une session ouverte, une inscription
   * suppose l'inverse.
   */
  async marquer(sessionId: string | undefined, etape: EtapeVisite, keycloakId?: string): Promise<void> {
    if (!sessionId || !FORMAT_SESSION.test(sessionId)) return;
    if (this.dejaEcrit(sessionId, etape)) return;
    const col = COLONNE[etape];
    await this.ecrire(
      `INSERT INTO visitor_session (sessionId, firstSeenAt, loggedInAtStart, ${col}, keycloakId)
       VALUES (?, NOW(), ?, 1, ?)
       ON DUPLICATE KEY UPDATE ${col} = 1, keycloakId = COALESCE(keycloakId, VALUES(keycloakId))`,
      [sessionId, etape === 'compte' ? 0 : 1, keycloakId ?? null],
    );
  }

  /**
   * Rattache une visite au compte qui s'en sert, sans marquer d'étape.
   *
   * Une seule raison d'exister : écarter des statistiques les visites des
   * comptes admin et internes, comme le fait déjà chaque agrégat du tableau de
   * bord. Le `sub` vient du jeton — le navigateur ne peut pas s'attribuer le
   * compte d'un autre, ni se soustraire aux chiffres en se déclarant interne.
   *
   * Crée la ligne si elle manque : l'appel authentifié prouve la visite là où
   * la balise `sendBeacon`, elle, a pu être bloquée par une extension.
   */
  async lier(sessionId: string | undefined, keycloakId: string): Promise<void> {
    if (!sessionId || !FORMAT_SESSION.test(sessionId)) return;
    if (this.dejaEcrit(sessionId, 'lien')) return;
    await this.ecrire(
      `INSERT INTO visitor_session (sessionId, firstSeenAt, loggedInAtStart, keycloakId)
       VALUES (?, NOW(), 1, ?)
       ON DUPLICATE KEY UPDATE keycloakId = COALESCE(keycloakId, VALUES(keycloakId))`,
      [sessionId, keycloakId],
    );
  }

  private async ecrire(sql: string, params: unknown[]): Promise<void> {
    try {
      await this.dataSource.query(sql, params);
    } catch (e) {
      this.logger.warn(`Visite non enregistrée : ${e}`);
    }
  }
}
