import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

type ThemeMode = 'system' | 'dark' | 'light';

interface AppSettings {
  apiBaseUrl: string;
  timeoutMs: number;
  useMockApi: boolean;

  themeMode: ThemeMode;
  compactMode: boolean;
  accentColor: string;

  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklyDigest: boolean;

  telemetry: boolean;
  crashReports: boolean;
}

const STORAGE_KEY = 'app_settings_v1';

const DEFAULTS: AppSettings = {
  apiBaseUrl: 'https://api.example.com',
  timeoutMs: 15000,
  useMockApi: false,

  themeMode: 'system',
  compactMode: false,
  accentColor: '#6ea8fe',

  emailAlerts: true,
  pushAlerts: false,
  weeklyDigest: true,

  telemetry: false,
  crashReports: true,
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

  savedBanner = '';
  saving = false;

  form = this.fb.group({
    apiBaseUrl: [DEFAULTS.apiBaseUrl, [Validators.required]],
    timeoutMs: [
      DEFAULTS.timeoutMs,
      [Validators.required, Validators.min(1000), Validators.max(120000)],
    ],
    useMockApi: [DEFAULTS.useMockApi],

    themeMode: [DEFAULTS.themeMode as ThemeMode, [Validators.required]],
    compactMode: [DEFAULTS.compactMode],
    accentColor: [DEFAULTS.accentColor, [Validators.required]],

    emailAlerts: [DEFAULTS.emailAlerts],
    pushAlerts: [DEFAULTS.pushAlerts],
    weeklyDigest: [DEFAULTS.weeklyDigest],

    telemetry: [DEFAULTS.telemetry],
    crashReports: [DEFAULTS.crashReports],
  });

  constructor() {
    this.load();
  }

  get dirty(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.flash('Please fix validation errors.');
      return;
    }

    this.saving = true;

    const value = this.form.getRawValue() as AppSettings;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      this.form.markAsPristine();
      this.flash('Saved ✓');
    } catch {
      this.flash('Failed to save (storage blocked?)');
    } finally {
      this.saving = false;
    }
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.form.reset(DEFAULTS);
    this.form.markAsPristine();
    this.flash('Reset to defaults.');
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const merged: AppSettings = { ...DEFAULTS, ...parsed };
      this.form.reset(merged);
      this.form.markAsPristine();
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      this.form.reset(DEFAULTS);
      this.form.markAsPristine();
    }
  }

  private flash(msg: string): void {
    this.savedBanner = msg;
    window.clearTimeout((this as any)._bannerTimer);
    (this as any)._bannerTimer = window.setTimeout(
      () => (this.savedBanner = ''),
      2400
    );
  }
}
