import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config';

export interface AdminUser {
  id: number;
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  credits: number;
  extraCredits: number;
  totalCredits: number;
  createdAt: string;
  lastLogin: string | null;
  projectCount: number;
  /** Rapports de marque produits (les demandes bloquées/en échec ne sont visibles que dans les logs). */
  brandReportCount: number;
  /**
   * Compte interne (le vôtre, une démonstration, un test) : écarté de toutes
   * les statistiques. Se coche à la main — rien dans les données ne le trahit.
   */
  isInternal: boolean;
}

export interface FeedbackItem {
  id: string;
  keycloakId: string | null;
  email: string | null;
  message: string;
  creditAwarded: boolean;
  rejected: boolean;
  createdAt: string;
}

/** Ce qu'on mesure sur une fenêtre. Voir `PeriodMetrics` côté API. */
export interface PeriodMetrics {
  from: string;
  to: string;
  /** `null` = non mesurable sur cette fenêtre, PAS zéro. */
  activeUsers: number | null;
  newUsers: number;
  newProjects: number;
  suggestions: number;
  brandReports: number;
  creditsConsumed: number;
  activatedUsers: number;
  /** En %, ou `null` si personne ne s'est inscrit sur la fenêtre. */
  activationRate: number | null;
}

export interface AdminStats {
  period: PeriodMetrics;
  /** Même durée, immédiatement avant la période choisie. */
  previous: PeriodMetrics;
  totalUsers: number;
  totalProjects: number;
  totalSuggestions: number;
  totalBrandReports: number;
  avgSuggestionsPerProject: number;
  avgFavoritesPerProject: number;
  totalFreeCredits: number;
  totalPackCredits: number;
  /** `AAAA-MM-JJ` du premier jour mesuré par le journal d'activité, ou `null`. */
  activityTrackingSince: string | null;
}

/** Un point hebdomadaire. `week` est le lundi, au format `AAAA-MM-JJ`. */
export interface WeeklyPoint {
  week: string;
  newUsers: number;
  /** `null` avant le démarrage du journal — un trou dans la courbe, pas un zéro. */
  activeUsers: number | null;
  projects: number;
  creditsConsumed: number;
}

export interface AdminSeries {
  weeks: WeeklyPoint[];
  activityTrackingSince: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private get base() { return `${this.config.apiUrl}/admin`; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  getUsers(
    page: number,
    limit: number,
    search: string,
    sort = 'createdAt',
    dir: 'ASC' | 'DESC' = 'DESC',
  ): Observable<{ data: AdminUser[]; total: number }> {
    // Le tri est fait par le SERVEUR : la liste est paginée, trier les vingt
    // lignes affichées donnerait « le plus récemment actif de cette page-ci »,
    // ce qui n'est pas la question qu'on pose au tableau.
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('search', search)
      .set('sort', sort)
      .set('dir', dir);
    return this.http.get<{ data: AdminUser[]; total: number }>(`${this.base}/users`, { params });
  }

  adjustCredits(userId: number, delta: number, reason: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${userId}/credits`, { delta, reason });
  }

  getStats(from?: Date, to?: Date): Observable<AdminStats> {
    let params = new HttpParams();
    if (from) params = params.set('from', from.toISOString());
    if (to) params = params.set('to', to.toISOString());
    return this.http.get<AdminStats>(`${this.base}/stats`, { params });
  }

  /**
   * Historique hebdomadaire. Appel distinct de `getStats` : la série ne dépend
   * pas de la période choisie et n'a donc pas à être rejouée à chaque clic.
   */
  getSeries(weeks = 26): Observable<AdminSeries> {
    return this.http.get<AdminSeries>(`${this.base}/series`, {
      params: new HttpParams().set('weeks', weeks),
    });
  }

  getFeedback(): Observable<FeedbackItem[]> {
    return this.http.get<FeedbackItem[]>(`${this.base}/feedback`);
  }

  awardFeedbackCredits(feedbackId: string): Observable<FeedbackItem> {
    return this.http.post<FeedbackItem>(`${this.base}/feedback/${feedbackId}/award-credits`, {});
  }

  rejectFeedback(feedbackId: string): Observable<FeedbackItem> {
    return this.http.post<FeedbackItem>(`${this.base}/feedback/${feedbackId}/reject`, {});
  }

  deleteFeedback(feedbackId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/feedback/${feedbackId}`);
  }

  /**
   * Marque un compte comme interne, ou l'en retire.
   *
   * L'état voulu est envoyé EXPLICITEMENT plutôt qu'une bascule : deux clics
   * rapides, ou deux onglets ouverts, laisseraient sinon le compte dans l'état
   * inverse de celui qu'on voit à l'écran.
   */
  setInternal(userId: number, internal: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${userId}/internal`, { internal });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${userId}`);
  }
}
