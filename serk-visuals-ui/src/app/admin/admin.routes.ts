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
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users.component').then((m) => m.UsersComponent),
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
];
