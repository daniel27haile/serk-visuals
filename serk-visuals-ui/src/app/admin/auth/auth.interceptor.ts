import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Send cookies for API calls (adjust host if you change API origin)
  const isApi =
    req.url.startsWith('http://localhost:3500/') || req.url.startsWith('/api/');
  return next(isApi ? req.clone({ withCredentials: true }) : req);
};
