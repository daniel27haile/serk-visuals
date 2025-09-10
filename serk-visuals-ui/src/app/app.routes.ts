import { Routes } from '@angular/router';
import { PublicLayoutsComponent } from './layouts/public-layouts/public-layouts.component';
import { AdminLayoutsComponent } from './layouts/admin-layouts/admin-layouts.component';
import { ADMIN_ROUTES } from './admin/admin.routes';

export const routes: Routes = [
  // Public shell
  {
    path: '',
    component: PublicLayoutsComponent, // must contain <router-outlet>
    children: [
      // Homepage at "/"
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/landing-page/landing-page.component').then(
            (m) => m.LandingPageComponent
          ),
      },
      // Keep "/home" working as an alias
      { path: 'home', redirectTo: '', pathMatch: 'full' },

      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact-us/contact-us.component').then(
            (m) => m.ContactUsComponent
          ),
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          ),
      },
      {
        path: 'gallery',
        loadComponent: () =>
          import('./pages/gallery/gallery.component').then(
            (m) => m.GalleryPage
          ), // ensure export name matches
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/booking/booking.component').then(
            (m) => m.BookingFormPage
          ), // ensure export name matches
      },
    ],
  },

  // Admin login outside admin shell
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },

  // Admin shell
  {
    path: 'admin',
    component: AdminLayoutsComponent, // must contain <router-outlet>
    children: ADMIN_ROUTES, // add a '**' child inside ADMIN_ROUTES if you want an admin-styled 404
    // canMatch: [adminAuthGuard],     // optional: protect admin
  },

  // Global 404 (keep last)
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
