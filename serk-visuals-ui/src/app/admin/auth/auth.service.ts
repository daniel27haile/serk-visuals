import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'editor';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3500/api/auth';

  readonly user = signal<AuthUser | null>(null);
  readonly loaded = signal(false);
  readonly isAuthenticated = computed(() => !!this.user());

  /** Try restore session from cookie */
  ensure() {
    if (this.loaded()) return of(this.isAuthenticated());
    return this.http
      .get<{ user: AuthUser | null }>(`${this.base}/me`, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => this.user.set(res.user)),
        tap(() => this.loaded.set(true)),
        map((res) => !!res.user),
        catchError(() => {
          this.loaded.set(true);
          return of(false);
        })
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<{ user: AuthUser }>(
        `${this.base}/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => this.user.set(res.user)),
        tap(() => this.loaded.set(true)),
        map((res) => res.user)
      );
  }

  logout() {
    return this.http
      .post(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.user.set(null)));
  }
}
