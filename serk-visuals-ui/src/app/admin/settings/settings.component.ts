import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AdminThemeService } from '../admin-shared/theme/admin-theme.service';

interface AdminPreferences {
  compactMode: boolean;
  confirmBeforeDelete: boolean;
  defaultGalleryColumns: number;
}

const STORAGE_KEY = 'sv_admin_prefs_v2';

const DEFAULTS: AdminPreferences = {
  compactMode: false,
  confirmBeforeDelete: true,
  defaultGalleryColumns: 3,
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  readonly themeService = inject(AdminThemeService);

  savedBanner = '';
  saving = false;

  form = this.fb.group({
    compactMode:          [DEFAULTS.compactMode],
    confirmBeforeDelete:  [DEFAULTS.confirmBeforeDelete],
    defaultGalleryColumns:[DEFAULTS.defaultGalleryColumns],
  });

  constructor() {
    this.load();
  }

  get dirty(): boolean {
    return this.form.dirty;
  }

  save(): void {
    this.saving = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.getRawValue()));
      this.form.markAsPristine();
      this.flash('Preferences saved');
    } catch {
      this.flash('Could not save (storage unavailable)');
    } finally {
      this.saving = false;
    }
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.form.reset(DEFAULTS);
    this.form.markAsPristine();
    this.flash('Reset to defaults');
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<AdminPreferences>;
      this.form.reset({ ...DEFAULTS, ...parsed });
      this.form.markAsPristine();
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private flash(msg: string): void {
    this.savedBanner = msg;
    window.clearTimeout((this as any)._t);
    (this as any)._t = window.setTimeout(() => (this.savedBanner = ''), 2800);
  }
}
