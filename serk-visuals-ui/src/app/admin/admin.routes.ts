import { Routes } from '@angular/router';
import { ContactAdminListComponent } from './admin-contact-us/contact-admin-list.component';
// (Detail component no longer used for "Open" flow)

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
  { path: 'contact', component: ContactAdminListComponent },

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
];
