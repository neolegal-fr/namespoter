import { Injectable } from '@nestjs/common';
import type { TrademarkResult } from '../dto/brand-report.types';

/**
 * Pré-vérification marque via l'API INPI diffusion (couvre FR+EU+WO en une
 * requête — cf. recette du spike US-050 dans le backlog).
 *
 * ⚠️ La recherche INPI (`POST /api/marques/search`) renvoie actuellement une
 * 500 côté serveur INPI (index vraisemblablement pas encore provisionné sur
 * l'accès fraîchement activé). Tant que ce n'est pas débloqué, on renvoie un
 * statut `unknown` honnête accompagné du lien profond de recherche officielle.
 *
 * Dès que `/search` répond 200, l'implémentation réelle se branche ici sans
 * changer le contrat : auth XSRF → login → POST search (query DSL `[Mark=…]`,
 * collections FMARK/CTMARK/TMINT). Voir scripts/inpi-marques-test.sh.
 */
@Injectable()
export class TrademarkService {
  /** Signal indicatif — jamais une recherche d'antériorité légale. */
  async check(name: string): Promise<TrademarkResult> {
    // TODO US-051 : appeler l'API INPI dès que la recherche est débloquée.
    return {
      office: 'INPI',
      match: 'unknown',
      hits: [],
      deepLink: this.deepLink(name),
      note: "Vérification automatique INPI temporairement indisponible — utilisez la recherche officielle.",
    };
  }

  /** Recherche officielle INPI pré-remplie (repli et CTA « démarche officielle »). */
  deepLink(name: string): string {
    return `https://data.inpi.fr/search?q=${encodeURIComponent(name)}&type=brands`;
  }
}
