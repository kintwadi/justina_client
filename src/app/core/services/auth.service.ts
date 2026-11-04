import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { ApiMessage, AuthResponse, AuthUser, RegisterPayload } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'aj.accessToken';
const REFRESH_TOKEN_KEY = 'aj.refreshToken';

/**
 * JWT authentication state for the storefront. Tokens are persisted in local storage so a page
 * reload keeps the session, and the current user is exposed as signals for `OnPush` components.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly userState = signal<AuthUser | null>(null);
  private accessTokenValue: string | null = this.read(ACCESS_TOKEN_KEY);
  private refreshTokenValue: string | null = this.read(REFRESH_TOKEN_KEY);
  private refreshInFlight: Observable<AuthResponse> | null = null;

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly isAdmin = computed(() => this.userState()?.role === 'ADMIN');
  readonly isOperator = computed(() => this.userState()?.role === 'OPERATOR');
  readonly isStaff = computed(() => {
    const role = this.userState()?.role;
    return role === 'ADMIN' || role === 'OPERATOR';
  });

  get accessToken(): string | null {
    return this.accessTokenValue;
  }

  get refreshToken(): string | null {
    return this.refreshTokenValue;
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(
        tap((response) => this.store(response)),
        map((response) => response.user),
      );
  }

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, payload)
      .pipe(
        tap((response) => this.store(response)),
        map((response) => response.user),
      );
  }

  forgotPassword(email: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_URL}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_URL}/auth/reset-password`, { token, password });
  }

  /** Restores the session on bootstrap; silently clears invalid tokens. */
  loadCurrentUser(): Observable<AuthUser | null> {
    if (!this.accessTokenValue) {
      return of(null);
    }
    return this.http.get<AuthUser>(`${API_URL}/auth/me`).pipe(
      tap((user) => this.userState.set(user)),
      catchError(() => {
        this.clear();
        return of(null);
      }),
    );
  }

  /** Revokes the refresh token server-side and clears the local session. */
  logout(): void {
    const refreshToken = this.refreshTokenValue;
    if (refreshToken) {
      this.http
        .post(`${API_URL}/auth/logout`, { refreshToken })
        .subscribe({ error: () => undefined });
    }
    this.clear();
  }

  /**
   * Refreshes the token pair, deduplicating concurrent calls so the rotating refresh token is only
   * exchanged once.
   */
  refreshOnce(): Observable<AuthResponse> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken: this.refreshTokenValue })
        .pipe(
          tap((response) => this.store(response)),
          finalize(() => (this.refreshInFlight = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refreshInFlight;
  }

  private store(response: AuthResponse): void {
    this.accessTokenValue = response.accessToken;
    this.refreshTokenValue = response.refreshToken;
    this.write(ACCESS_TOKEN_KEY, response.accessToken);
    this.write(REFRESH_TOKEN_KEY, response.refreshToken);
    this.userState.set(response.user);
  }

  private clear(): void {
    this.accessTokenValue = null;
    this.refreshTokenValue = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.userState.set(null);
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private mode) — the session simply won't survive a reload.
    }
  }
}
