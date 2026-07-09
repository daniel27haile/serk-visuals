import { Routes } from '@angular/router';
import { PublicLayoutsComponent } from './layouts/public-layouts/public-layouts.component';
import { ADMIN_ROUTES } from './admin/admin.routes';
import { adminAuthGuard } from './admin/auth/admin-auth.guard';

export const routes = [
  {
    path: '',
    component: PublicLayoutsComponent,
    children: [
      {
        path: '',
        title: 'Serk Visuals | Wedding & Portrait Photographer in Seattle, WA',
        data: {
          description:
            'Serk Visuals — professional photography and videography for weddings, portraits, events, branding, and real estate in Seattle, Mill Creek, Everett, and across the greater Puget Sound region.',
        },
        loadComponent: () =>
          import('./pages/landing-page/landing-page.component').then(
            (m) => m.LandingPageComponent
          ),
      },
      { path: 'home', redirectTo: '', pathMatch: 'full' as const },

      {
        path: 'contact',
        title: 'Contact Serk Visuals | Seattle Photography Studio',
        data: {
          description:
            'Get in touch with Serk Visuals to book a session or ask about photography and videography services in Seattle, Bellevue, Everett, Kirkland, and surrounding areas.',
        },
        loadComponent: () =>
          import('./pages/contact-us/contact-us.component').then(
            (m) => m.ContactUsComponent
          ),
      },
      {
        path: 'about-us',
        title: 'About Serk Visuals | Seattle Photography & Videography Studio',
        data: {
          description:
            'Meet the team behind Serk Visuals — a passionate photography and videography studio based in the Seattle area, dedicated to capturing weddings, portraits, events, and brands with intention.',
        },
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          ),
      },
      {
        path: 'gallery',
        title: 'Photography Portfolio | Weddings, Portraits & Events — Serk Visuals',
        data: {
          description:
            'Browse the Serk Visuals portfolio — wedding photography, portrait sessions, corporate events, branding shoots, real estate photography, and videography across the Seattle and Puget Sound area.',
        },
        loadComponent: () =>
          import('./pages/gallery/gallery.component').then(
            (m) => m.GalleryPage
          ),
      },
      {
        path: 'services',
        title: 'Photography & Videography Services in Seattle | Serk Visuals',
        data: {
          description:
            'Explore all Serk Visuals services — wedding photography, event photography, portrait sessions, branding shoots, real estate photography, videography, and professional photo and video editing.',
        },
        loadComponent: () =>
          import('./pages/services/services.component').then(
            (m) => m.ServicesComponent
          ),
      },
      {
        path: 'bookings',
        title: 'Book a Photography Session | Serk Visuals Seattle',
        data: {
          description:
            'Ready to book? Schedule your wedding, portrait, event, branding, or real estate photography session with Serk Visuals. Serving Seattle, Bellevue, Kirkland, Everett, and surrounding Washington communities.',
        },
        loadComponent: () =>
          import('./pages/booking/booking.component').then(
            (m) => m.BookingFormPage
          ),
      },
      {
        path: 'real-estate',
        title: 'Real Estate Photography Seattle | Serk Visuals',
        data: {
          description:
            'Professional real estate photography in Seattle — interior, exterior, twilight, drone, walkthrough video, floor plans, and virtual tours. Delivered in 24–48 hours. Book online.',
        },
        loadComponent: () =>
          import('./pages/real-estate/real-estate.component').then(
            (m) => m.RealEstateComponent
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
    loadComponent: () =>
      import('./layouts/admin-layouts/admin-layouts.component').then(
        (m) => m.AdminLayoutsComponent
      ),
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
