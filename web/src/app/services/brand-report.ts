import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config';

export type Availability = 'free' | 'taken' | 'unknown';
export type TrademarkMatch = 'none' | 'exact' | 'similar' | 'unknown';

export interface DomainAvailability {
  extension: string;
  domain: string;
  status: Availability;
}

export interface SocialAvailability {
  platform: string;
  handle: string;
  url: string;
  status: Availability;
  planned?: boolean;
}

export interface TrademarkHit {
  name: string;
  classes: number[];
  status?: string;
  collection?: 'FR' | 'EU' | 'WO';
  applicationNumber?: string;
  noticeUrl?: string;
}

export interface TrademarkResult {
  office: 'INPI';
  match: TrademarkMatch;
  hits: TrademarkHit[];
  deepLink: string;
  note?: string;
}

export interface NameQuality {
  score: number; // 0-100
  scores: Record<string, number>; // critère -> note 1-5
  strengths?: string;
  watchout?: string;
}

export interface BrandReport {
  name: string;
  handle: string;
  domains: DomainAvailability[];
  socials: SocialAvailability[];
  trademark: TrademarkResult;
  quality?: NameQuality;
  score: number;
  generatedAt: string;
  disclaimer: string;
  /** Jeton de partage public (présent une fois le rapport mémorisé). */
  shareToken?: string;
  /** Présents uniquement sur le rapport complet (authentifié). */
  remainingCredits?: number;
  emailed?: boolean;
  /** true = rapport déjà généré, renvoyé sans nouveau débit. */
  cached?: boolean;
  /** Crédits réellement débités : 0 si le rapport offert du mois a été consommé. */
  costCredits?: number;
}

/**
 * Ce que le serveur dit de l'offre pour un nom, AVANT achat. Aucun verdict :
 * seulement de quoi afficher le bon libellé et le bon bouton.
 */
export interface BrandReportOffer {
  deepReport: {
    purchased: boolean;
    priceCredits: number;
    /** Le rapport offert du mois calendaire est-il encore disponible ? */
    freeThisMonth: boolean;
  };
  account: { credits: number };
}


/**
 * Synthèse d'un nom déjà vérifié, affichée sur sa carte de résultat.
 * N'existe que pour les noms dont le rapport est acquis.
 */
export interface BrandReportSummary {
  nameKey: string;
  verifiedAt: string | null;
  trademark: 'none' | 'exact' | 'similar' | 'unknown';
  inpiHits: boolean;
  euipoHits: boolean;
  socials: { platform: string; status: 'free' | 'taken' | 'unknown' }[];
  score: number | null;
}

/** Coût affiché du rapport complet (aligné sur BRAND_REPORT_COST côté API). */
export const BRAND_REPORT_COST = 50;

@Injectable({ providedIn: 'root' })
export class BrandReportService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get apiUrl() {
    return `${this.config.apiUrl}/brand-report`;
  }

  /** Aperçu public bridé (domaine phare + quelques réseaux) — pas d'auth. */
  preview(name: string): Observable<BrandReport> {
    return this.http.post<BrandReport>(`${this.apiUrl}/preview`, { name });
  }

  /** Rapport déjà généré pour ce nom (authentifié) — pour éviter un re-débit. */
  /** Synthèses des noms vérifiés — verdicts déjà payés, pour la grille. */
  summaries(): Observable<{ summaries: BrandReportSummary[] }> {
    return this.http.get<{ summaries: BrandReportSummary[] }>(`${this.apiUrl}/summaries`);
  }

  /** État de l'offre pour un nom : acheté, prix, droit gratuit, solde. Sans verdict. */
  offer(name: string): Observable<BrandReportOffer> {
    return this.http.get<BrandReportOffer>(`${this.apiUrl}/offer`, { params: { name } });
  }

  existing(name: string): Observable<{ exists: boolean; report?: BrandReport }> {
    return this.http.get<{ exists: boolean; report?: BrandReport }>(`${this.apiUrl}/existing`, { params: { name } });
  }

  /** Noms déjà rapportés par l'utilisateur (pour afficher « Voir le rapport »). */
  mine(): Observable<{ names: string[] }> {
    return this.http.get<{ names: string[] }>(`${this.apiUrl}/mine`);
  }

  /** Rapport partagé en lecture seule (public, via jeton). */
  shared(token: string): Observable<BrandReport> {
    return this.http.get<BrandReport>(`${this.apiUrl}/shared/${token}`);
  }

  /** Rapport complet (authentifié, payant ; le token est ajouté par l'intercepteur). */
  full(name: string, options?: { extensions?: string[]; emails?: string[]; force?: boolean }): Observable<BrandReport> {
    return this.http.post<BrandReport>(this.apiUrl, {
      name,
      ...(options?.extensions ? { extensions: options.extensions } : {}),
      ...(options?.emails?.length ? { emails: options.emails } : {}),
      ...(options?.force ? { force: true } : {}),
    });
  }
}
