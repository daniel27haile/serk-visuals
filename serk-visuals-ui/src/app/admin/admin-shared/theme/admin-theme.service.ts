import { Injectable, computed, signal } from '@angular/core';

// ── Theme model ───────────────────────────────────────────
export interface AdminTheme {
  id: string;
  name: string;
  description: string;
  /** Small preview swatches shown in the Settings picker */
  preview: { bg: string; sidebar: string; accent: string; text: string };
}

// ── Theme catalog — add new entries here for Theme 3, 4… ─
export const ADMIN_THEMES: AdminTheme[] = [
  {
    id: 'theme-1',
    name: 'Warm Obsidian',
    description: 'Default dark theme with warm purple tones and orange accents.',
    preview: { bg: '#111020', sidebar: '#0e0c1a', accent: '#ff6a00', text: '#f0eef8' },
  },
  {
    id: 'theme-2',
    name: 'Clean Monochrome',
    description: 'Pure white backgrounds with pure black text and accents.',
    preview: { bg: '#ffffff', sidebar: '#f0f0f0', accent: '#000000', text: '#000000' },
  },
];

const STORAGE_KEY = 'admin_theme_v1';

// ── Service ───────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminThemeService {
  private readonly _activeId = signal<string>(this._readStorage());

  /** All available themes — read-only for components */
  readonly themes: AdminTheme[] = ADMIN_THEMES;

  /** ID of the currently active theme */
  readonly activeThemeId = this._activeId.asReadonly();

  /** Full theme object of the currently active theme */
  readonly activeTheme = computed(
    () => ADMIN_THEMES.find(t => t.id === this._activeId()) ?? ADMIN_THEMES[0],
  );

  /**
   * Switch to a theme by id. Persists to localStorage immediately.
   * The template binds [attr.data-admin-theme] to activeThemeId(),
   * so CSS variable overrides in the layout SCSS apply instantly.
   */
  setTheme(id: string): void {
    if (!ADMIN_THEMES.find(t => t.id === id)) return;
    this._activeId.set(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* storage blocked */ }
  }

  private _readStorage(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ADMIN_THEMES.find(t => t.id === saved)) return saved;
    } catch { /* storage blocked */ }
    return ADMIN_THEMES[0].id;
  }
}
