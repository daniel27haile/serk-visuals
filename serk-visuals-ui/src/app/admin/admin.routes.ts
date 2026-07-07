import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./admin-dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./admin-booking/admin-booking.component').then(
        (m) => m.AdminBookingComponent
      ),
  },

  // Contacts: list only; "Open" uses modal on same page
  {
    path: 'contact',
    loadComponent: () =>
      import('./admin-contact-us/contact-admin-list.component').then(
        (m) => m.ContactAdminListComponent
      ),
  },

  {
    path: 'projects',
    loadComponent: () =>
      import('./projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./admin-gallery/admin-gallery.component').then(
        (m) => m.AdminGalleryComponent
      ),
  },

  {
    path: 'testimonials',
    loadComponent: () =>
      import('./admin-testimonials/admin-testimonials.component').then(
        (m) => m.AdminTestimonialsComponent
      ),
    title: 'Admin • Testimonials',
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./admin-pricing/admin-pricing.component').then(
        (m) => m.AdminPricingComponent
      ),
    title: 'Admin • Pricing',
  },
];
