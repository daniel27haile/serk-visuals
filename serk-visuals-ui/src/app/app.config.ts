import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './admin/auth/auth.interceptor';
import { authErrorInterceptor } from './admin/auth/auth-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', // scroll to top on forward nav, restore on back
        anchorScrolling: 'enabled',           // honour [fragment] links and /path#id URLs
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor, authErrorInterceptor])),
  ],
};
