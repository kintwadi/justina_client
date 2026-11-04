import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';

const AUTH_PATHS = '/api/auth/';

/**
 * Attaches the JWT to backend requests and transparently refreshes it once when the access token
 * has expired, replaying the original request with the new token.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isApiRequest = request.url.startsWith(API_BASE_URL);
  const isAuthRequest = request.url.includes(AUTH_PATHS);
  const token = auth.accessToken;

  const authorized =
    isApiRequest && token && !isAuthRequest
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const canRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isAuthRequest &&
        !!auth.refreshToken;

      if (!canRefresh) {
        return throwError(() => error);
      }

      return auth.refreshOnce().pipe(
        switchMap((response) =>
          next(
            request.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } }),
          ),
        ),
        catchError((refreshError: unknown) => {
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
