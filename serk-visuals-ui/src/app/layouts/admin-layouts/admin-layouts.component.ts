import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from '../../admin/auth/auth.service';

// @Component({
//   selector: 'app-admin-layouts',
//   standalone: true,
//   imports: [RouterOutlet, RouterLink, NgIf],
//   templateUrl: './admin-layouts.component.html',
//   styleUrl: './admin-layouts.component.scss',
// })
// export class AdminLayoutsComponent {
//   // admin-layouts.component.ts
//   sideOpen = false;
// }


// // layouts/admin-layouts/admin-layouts.component.ts
// import { NgIf } from '@angular/common';
// import { Component, inject } from '@angular/core';
// import { RouterLink, RouterOutlet, Router } from "@angular/router";
// import { AuthService } from '../../admin/auth/auth.service';

@Component({
  selector: 'app-admin-layouts',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf],
  templateUrl: './admin-layouts.component.html',
  styleUrl: './admin-layouts.component.scss',
})
export class AdminLayoutsComponent {
  sideOpen = false;
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout().subscribe({ next: () => this.router.navigateByUrl('/admin/login') });
  }
}

