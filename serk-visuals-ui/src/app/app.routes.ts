import { Routes } from '@angular/router';
import { PublicLayoutsComponent } from './layouts/public-layouts/public-layouts.component';
import { AdminLayoutsComponent } from './layouts/admin-layouts/admin-layouts.component';
import { ADMIN_ROUTES } from './admin/admin.routes';
import { adminAuthGuard } from './admin/auth/admin-auth.guard';

export const routes = [
  {
    path: '',
    component: PublicLayoutsComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/landing-page/landing-page.component').then(
            (m) => m.LandingPageComponent
          ),
      },
      { path: 'home', redirectTo: '', pathMatch: 'full' as const },

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
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/booking/booking.component').then(
            (m) => m.BookingFormPage
          ),
      },
    ],
  },

  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },

  {
    path: 'admin',
    component: AdminLayoutsComponent,
    canMatch: [adminAuthGuard],
    children: ADMIN_ROUTES,
  },

  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
] as const satisfies Routes;
