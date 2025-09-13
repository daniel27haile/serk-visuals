import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const adminAuthGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth
    .ensure()
    .pipe(map((ok) => (ok ? true : router.parseUrl('/admin/login'))));
};
