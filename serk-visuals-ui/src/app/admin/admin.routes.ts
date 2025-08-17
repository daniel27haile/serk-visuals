import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import("./admin-login/admin-login.component").then(m => m.AdminLoginComponent),
  },
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
      import('./admin-booking/booking.component').then((m) => m.BookingComponent),
  },
  {
    path: 'media',
    loadComponent: () =>
      import('./media/media.component').then((m) => m.MediaComponent),
  },
];
