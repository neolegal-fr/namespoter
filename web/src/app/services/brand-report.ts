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
  /** Présents uniquement sur le rapport complet (authentifié). */
  remainingCredits?: number;
  emailed?: boolean;
  /** true = rapport déjà généré, renvoyé sans nouveau débit. */
  cached?: boolean;
}

/** Coût affiché du rapport complet (aligné sur BRAND_REPORT_COST côté API). */
export const BRAND_REPORT_COST = 500;

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
  existing(name: string): Observable<{ exists: boolean; report?: BrandReport }> {
    return this.http.get<{ exists: boolean; report?: BrandReport }>(`${this.apiUrl}/existing`, { params: { name } });
  }

  /** Rapport complet (authentifié, payant ; le token est ajouté par l'intercepteur). */
  full(name: string, options?: { extensions?: string[]; emails?: string[] }): Observable<BrandReport> {
    return this.http.post<BrandReport>(this.apiUrl, {
      name,
      ...(options?.extensions ? { extensions: options.extensions } : {}),
      ...(options?.emails?.length ? { emails: options.emails } : {}),
    });
  }
}
