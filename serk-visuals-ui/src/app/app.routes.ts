import { Routes } from '@angular/router';
import { PublicLayoutsComponent } from './layouts/public-layouts/public-layouts.component';
import { AdminLayoutsComponent } from './layouts/admin-layouts/admin-layouts.component';
import { ADMIN_ROUTES } from './admin/admin.routes';

export const routes: Routes = [
  // public shell...
  {
    path: '',
    component: PublicLayoutsComponent,
    children: [
      // your public pages here...
      {
        path: 'contact-us',
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
        path: 'contact-us',
        loadComponent: () =>
          import('./pages/booking/booking.component').then(
            (m) => m.BookingFormPage
          ),
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/landing-page/landing-page.component').then(
            (m) => m.LandingPageComponent
          ),
      },
    ],
  },

  // login OUTSIDE the admin shell
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },

  // admin shell + children
  {
    path: 'admin',
    component: AdminLayoutsComponent,
    children: ADMIN_ROUTES,
  },

  { path: '**', redirectTo: '' },
];
