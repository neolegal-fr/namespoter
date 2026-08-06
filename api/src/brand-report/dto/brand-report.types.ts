/**
 * Contrat du « Rapport de disponibilité de marque » (épic US-050→055).
 *
 * Trois états stricts, alignés sur la sémantique de disponibilité domaine :
 * un échec de source ne se déguise JAMAIS en « libre ». Tout doute reste
 * `unknown` — cf. règle de disponibilité dans CLAUDE.md.
 */
export type Availability = 'free' | 'taken' | 'unknown';

/** Disponibilité d'un domaine sur une extension donnée. */
export interface DomainAvailability {
  extension: string; // ex. 'com', 'fr'
  domain: string; // ex. 'namorama.com'
  status: Availability;
}

/** Disponibilité d'un pseudo sur une plateforme sociale. */
export interface SocialAvailability {
  platform: string; // ex. 'GitHub'
  handle: string; // pseudo testé
  url: string; // URL du profil (pris) ou d'inscription
  status: Availability;
  /** Adaptateur pas encore livré → toujours `unknown` (cf. spike US-050). */
  planned?: boolean;
}

export type TrademarkMatch = 'none' | 'exact' | 'similar' | 'unknown';

/** Résultat de pré-vérification marque pour un registre (INPI/EUIPO/WO). */
export interface TrademarkResult {
  office: 'INPI'; // périmètre phase 1 : API INPI (couvre FR+EU+WO)
  match: TrademarkMatch;
  /** Dépôts trouvés (vide tant que la recherche INPI n'est pas débloquée). */
  hits: TrademarkHit[];
  /** Repli : recherche officielle à l'URL profonde tant que l'API est indisponible. */
  deepLink: string;
  note?: string;
}

export interface TrademarkHit {
  name: string;
  classes: number[]; // classes de Nice (issues de la notice, pour les dépôts pertinents)
  status?: string;
  collection?: 'FR' | 'EU' | 'WO';
  applicationNumber?: string;
  /** URL de la notice officielle (ST66) — lien « voir la notice » dans le rapport. */
  noticeUrl?: string;
}

/** Qualité intrinsèque du nom (analyse IA : 5 critères notés 1-5). */
export interface NameQuality {
  /** Score global 0-100 (moyenne des 5 critères). */
  score: number;
  /** Notes par critère (memorability, pronunciation, international, seo, distinctiveness). */
  scores: Record<string, number>;
  strengths?: string;
  watchout?: string;
}

/** Rapport complet consommé par l'affichage, le PDF (US-053) et l'email. */
export interface BrandReport {
  name: string;
  handle: string;
  domains: DomainAvailability[];
  socials: SocialAvailability[];
  trademark: TrademarkResult;
  /** Qualité du nom (présente sur le rapport complet, pas sur l'aperçu). */
  quality?: NameQuality;
  /** Synthèse 0-100. Les items `unknown` n'améliorent jamais le score. */
  score: number;
  generatedAt: string; // ISO 8601
  /** Signal indicatif — jamais une recherche d'antériorité légale. */
  disclaimer: string;
}
