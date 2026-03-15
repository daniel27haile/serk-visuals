import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Send cookies for API calls — works for both absolute (dev) and relative (prod reverse-proxy) URLs
  const isApiCall = environment.apiUrl
    ? req.url.startsWith(environment.apiUrl + '/')
    : req.url.startsWith('/api/');
  return next(isApiCall ? req.clone({ withCredentials: true }) : req);
};
