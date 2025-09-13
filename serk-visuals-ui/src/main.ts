import { bootstrapApplication } from '@angular/platform-browser';
import { authInterceptor } from './app/admin/auth/auth.interceptor';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router';

// bootstrapApplication(AppComponent, {
//   providers: [provideRouter(routes), provideHttpClient(withFetch())],
// });



bootstrapApplication(AppComponent, {
  providers:  [provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
  ],
});

