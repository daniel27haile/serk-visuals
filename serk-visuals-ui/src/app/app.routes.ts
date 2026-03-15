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
        title: 'Serk Visuals | Professional Photography & Videography',
        data: {
          description:
            'Serk Visuals — professional photography and videography for weddings, events, portraits, and brands. Book your session today.',
        },
        loadComponent: () =>
          import('./pages/landing-page/landing-page.component').then(
            (m) => m.LandingPageComponent
          ),
      },
      { path: 'home', redirectTo: '', pathMatch: 'full' as const },

      {
        path: 'contact',
        title: 'Contact Us | Serk Visuals',
        data: {
          description:
            'Get in touch with Serk Visuals to book a session or ask about photography and videography services.',
        },
        loadComponent: () =>
          import('./pages/contact-us/contact-us.component').then(
            (m) => m.ContactUsComponent
          ),
      },
      {
        path: 'about-us',
        title: 'About Us | Serk Visuals',
        data: {
          description:
            'Learn about Serk Visuals — a passionate photography and videography studio dedicated to capturing your most meaningful moments.',
        },
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          ),
      },
      {
        path: 'gallery',
        title: 'Gallery | Serk Visuals',
        data: {
          description:
            'Browse the Serk Visuals portfolio — weddings, events, portraits, product photography, and more.',
        },
        loadComponent: () =>
          import('./pages/gallery/gallery.component').then(
            (m) => m.GalleryPage
          ),
      },
      {
        path: 'bookings',
        title: 'Book a Session | Serk Visuals',
        data: {
          description:
            'Book your photography or videography session with Serk Visuals. Weddings, events, portraits, and commercial work.',
        },
        loadComponent: () =>
          import('./pages/booking/booking.component').then(
            (m) => m.BookingFormPage
          ),
      },
    ],
  },

  {
    path: 'admin/login',
    title: 'Admin Login | Serk Visuals',
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
    title: 'Page Not Found | Serk Visuals',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
] as const satisfies Routes;
