import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, Subject } from 'rxjs';
import { ConfigService } from './config';

export type SharePermission = 'read' | 'write';

/** Ce que le serveur renvoie pour un projet reçu en partage. */
export interface SharedProject {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  permission: SharePermission;
  ownerEmail: string | null;
}

/** Une invitation, vue par le propriétaire du projet. */
export interface ProjectShare {
  id: string;
  email: string;
  permission: SharePermission;
  message: string | null;
  createdAt: string;
  /** Nul tant que l'invité n'a pas ouvert le projet : invitation partie ≠ reçue. */
  acceptedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private get apiUrl() { return `${this.config.apiUrl}/projects`; }

  // État partagé
  showDrawer = signal(false);
  showCreditDialog = signal(false);
  projects = signal<any[]>([]);
  /** Projets qu'on m'a partagés — liste distincte de la mienne, à dessein. */
  sharedProjects = signal<SharedProject[]>([]);

  // Événements
  private resetWizardSource = new Subject<void>();
  resetWizard$ = this.resetWizardSource.asObservable();

  constructor(private http: HttpClient, private config: ConfigService) {}

  resetWizard() {
    this.resetWizardSource.next();
  }

  refreshProjects(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(projects => this.projects.set(projects))
    );
  }

  /**
   * Projets partagés avec moi.
   *
   * Séparés des miens dans une liste à part : le tiroir doit dire de qui vient
   * un projet et ce qu'on y a le droit de faire. Les mélanger ferait croire
   * qu'on peut tout y faire — et supprimer celui d'un autre.
   */
  refreshSharedProjects(): Observable<SharedProject[]> {
    return this.http.get<SharedProject[]>(`${this.apiUrl}/shared-with-me`).pipe(
      tap((projects) => this.sharedProjects.set(projects)),
    );
  }

  listShares(projectId: string): Observable<ProjectShare[]> {
    return this.http.get<ProjectShare[]>(`${this.apiUrl}/${projectId}/shares`);
  }

  invite(projectId: string, data: { email: string; permission: SharePermission; message?: string }): Observable<ProjectShare> {
    return this.http.post<ProjectShare>(`${this.apiUrl}/${projectId}/shares`, data);
  }

  revokeShare(projectId: string, shareId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/shares/${shareId}`);
  }

  getProject(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateProject(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Crée un projet à partir d'un nom seul — le chemin de qui a déjà une idée.
   * Aucun débit : rien n'est généré, le contrôle de disponibilité est gratuit.
   */
  createFromName(name: string, extensions?: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/from-name`, { name, extensions });
  }

  setRating(suggestionId: string, rating: 'liked' | 'disliked' | 'neutral'): Observable<{ rating: string }> {
    return this.http.patch<{ rating: string }>(`${this.apiUrl}/suggestions/${suggestionId}/rating`, { rating });
  }

  updateSuggestionsAvailability(updates: { id: string; availability: Record<string, boolean> }[]): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/suggestions/availability`, { updates });
  }

  addSuggestion(projectId: string, domainName: string, availability: Record<string, boolean>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/suggestions`, { domainName, availability });
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}