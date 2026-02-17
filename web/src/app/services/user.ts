import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';
  private creditsSubject = new BehaviorSubject<number>(0);
  credits$ = this.creditsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCredits(): Observable<{ credits: number }> {
    return this.http.get<{ credits: number }>(`${this.apiUrl}/credits`).pipe(
      tap(res => this.creditsSubject.next(res.credits))
    );
  }

  updateCredits(amount: number) {
    this.creditsSubject.next(amount);
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  addCredits(amount: number): Observable<{ credits: number }> {
    return this.http.post<{ credits: number }>(`${this.apiUrl}/add-credits`, { amount }).pipe(
      tap(res => this.creditsSubject.next(res.credits))
    );
  }
}


  