import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-admin-layouts',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf],
  templateUrl: './admin-layouts.component.html',
  styleUrl: './admin-layouts.component.scss',
})
export class AdminLayoutsComponent {
  // admin-layouts.component.ts
  sideOpen = false;
}
