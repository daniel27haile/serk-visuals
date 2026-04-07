// layouts/admin-layouts/admin-layouts.component.ts
import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../../admin/auth/auth.service';
import { AdminThemeService } from '../../admin/admin-shared/theme/admin-theme.service';

@Component({
  selector: 'app-admin-layouts',
  standalone: true,
  // ✅ IMPORTANT: add RouterLinkActive so routerLinkActiveOptions works
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './admin-layouts.component.html',
  styleUrl: './admin-layouts.component.scss',
})
export class AdminLayoutsComponent {
  sideOpen = false;

  readonly themeService = inject(AdminThemeService);
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/admin/login'),
    });
  }
}
