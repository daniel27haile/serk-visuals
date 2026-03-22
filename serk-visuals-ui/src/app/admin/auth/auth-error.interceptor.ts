import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Intercepts 401 responses from the API and clears stale auth state,
 * then redirects to the login page. This handles the case where the
 * session cookie is present but the backend rejects it (e.g. the user
 * document was deleted, JWT secret rotated, or cookie expired).
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApiCall = environment.apiUrl
    ? req.url.startsWith(environment.apiUrl + '/')
    : req.url.startsWith('/api/');

  return next(req).pipe(
    catchError((err: unknown) => {
      if (isApiCall && err instanceof HttpErrorResponse && err.status === 401) {
        auth.user.set(null);
        auth.loaded.set(true);
        router.navigateByUrl('/admin/login');
      }
      return throwError(() => err);
    })
  );
};
