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

export interface BrandReport {
  name: string;
  handle: string;
  domains: DomainAvailability[];
  socials: SocialAvailability[];
  trademark: TrademarkResult;
  score: number;
  generatedAt: string;
  disclaimer: string;
  /** Présents uniquement sur le rapport complet (authentifié). */
  remainingCredits?: number;
  emailed?: boolean;
}

/** Coût affiché du rapport complet (aligné sur BRAND_REPORT_COST côté API). */
export const BRAND_REPORT_COST = 300;

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

  /** Rapport complet (authentifié, 300 crédits ; le token est ajouté par l'intercepteur). */
  full(name: string, extensions?: string[]): Observable<BrandReport> {
    return this.http.post<BrandReport>(this.apiUrl, { name, ...(extensions ? { extensions } : {}) });
  }
}
