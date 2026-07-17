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
        title: 'Serk Visuals | Real Estate Photography Seattle, WA',
        data: {
          description:
            'Professional real estate photography in Seattle and Greater Puget Sound — interior, exterior, twilight, aerial, floor plans, and walkthrough video. MLS-ready images delivered within 48 hours. Serving agents, property managers, and homeowners.',
        },
        loadComponent: () =>
          import('./pages/landing-page/landing-page.component').then(
            (m) => m.LandingPageComponent
          ),
      },
      { path: 'home', redirectTo: '', pathMatch: 'full' as const },

      {
        path: 'contact',
        title: 'Contact Serk Visuals | Real Estate Photography Seattle',
        data: {
          description:
            'Get in touch with Serk Visuals to book a property shoot or ask about real estate photography services in Seattle, Bellevue, Kirkland, Everett, and surrounding areas of Greater Puget Sound.',
        },
        loadComponent: () =>
          import('./pages/contact-us/contact-us.component').then(
            (m) => m.ContactUsComponent
          ),
      },
      {
        path: 'about-us',
        title: 'About Serk Visuals | Real Estate Photography Studio Seattle',
        data: {
          description:
            'Learn about Serk Visuals — a professional real estate photography studio based in the Seattle area, dedicated to helping agents, property managers, and homeowners market their properties with high-quality photography.',
        },
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          ),
      },
      {
        path: 'gallery',
        title: 'Property Photography Portfolio | Serk Visuals Seattle',
        data: {
          description:
            'Browse the Serk Visuals portfolio — residential homes, luxury listings, condos, townhomes, commercial properties, and more. Professional real estate photography across Seattle and Greater Puget Sound.',
        },
        loadComponent: () =>
          import('./pages/gallery/gallery.component').then(
            (m) => m.GalleryPage
          ),
      },
      {
        path: 'services',
        title: 'Real Estate Photography Services Seattle | Serk Visuals',
        data: {
          description:
            'Real estate photography, property measurements, wedding photography, events, and portraits — Serk Visuals provides full-service visual media for agents, property managers, and individuals across Seattle and Greater Puget Sound.',
        },
        loadComponent: () =>
          import('./pages/services/services.component').then(
            (m) => m.ServicesComponent
          ),
      },
      {
        path: 'bookings',
        title: 'Book a Property Shoot | Serk Visuals Real Estate Photography',
        data: {
          description:
            'Book your real estate photography session with Serk Visuals. Select your services, choose a date, and receive MLS-ready photos within 48 hours. Serving Seattle, Bellevue, Kirkland, Everett, and surrounding Washington communities.',
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
      {
        path: 'portfolio/real-estate',
        title: 'Real Estate Photography Portfolio | Serk Visuals Seattle',
        data: {
          description:
            'Browse our real estate photography portfolio — residential homes, luxury listings, condos, townhomes, and commercial properties across Seattle and Greater Puget Sound.',
        },
        loadComponent: () =>
          import('./pages/portfolio/re-portfolio.component').then(
            (m) => m.RePortfolioComponent
          ),
      },
      {
        path: 'portfolio/real-estate/:slug',
        title: 'Property Portfolio | Serk Visuals Seattle',
        data: {
          description: 'Real estate photography project by Serk Visuals — professional property photography in Seattle, WA.',
        },
        loadComponent: () =>
          import('./pages/portfolio/re-portfolio-detail/re-portfolio-detail.component').then(
            (m) => m.RePortfolioDetailComponent
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
