import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DomainService {
  private apiUrl = 'http://localhost:3000/domain';

  constructor(private http: HttpClient) {}

  refineDescription(description: string): Observable<{ refined: string }> {
    return this.http.post<{ refined: string }>(`${this.apiUrl}/refine`, { description });
  }

  suggestProjectName(description: string): Observable<{ suggestedName: string }> {
    return this.http.post<{ suggestedName: string }>(`${this.apiUrl}/suggest-name`, { description });
  }

    generateKeywords(description: string, locale?: string | null): Observable<{ keywords: string[] }> {

      return this.http.post<{ keywords: string[] }>(`${this.apiUrl}/keywords`, { description, ...(locale ? { locale } : {}) });

    }

  

    recheckDomains(names: string[], extensions: string[]): Observable<{ domains: { name: string; allExtensions: Record<string, boolean> }[] }> {
    return this.http.post<any>(`${this.apiUrl}/recheck`, { names, extensions });
  }

      searchDomains(description: string, keywords: string[], extensions: string[], matchMode: string, projectId?: string, projectName?: string, locale?: string | null): Observable<any> {



          return this.http.post<any>(`${this.apiUrl}/search`, { description, keywords, extensions, matchMode, projectId, projectName, ...(locale ? { locale } : {}) });

  

        }

  

      }

  

      

  

    

  