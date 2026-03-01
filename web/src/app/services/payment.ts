import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config';

export type PackType = 'decouverte' | 'pro' | 'max';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private get apiUrl() { return `${this.config.apiUrl}/payments`; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  createPackCheckout(packType: PackType): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/checkout/pack`, { packType });
  }

  fulfillSession(sessionId: string): Observable<{ creditsAdded: number; totalCredits: number; freeCredits: number; packCredits: number }> {
    return this.http.post<any>(`${this.apiUrl}/fulfill-session`, { sessionId });
  }
}
