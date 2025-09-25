import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { ProjectsService, Project, ProjectStatus } from './projects.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ProjectsService);

  // Filters / paging
  q = signal<string>('');
  status = signal<ProjectStatus | ''>('');
  year = signal<number | ''>('');
  month = signal<number | ''>('');
  page = signal(1);
  pageSize = signal(10);

  // Data
  items = signal<Project[]>([]);
  total = signal(0);
  pages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize()))
  );
  loading = signal(false);
  error = signal<string | null>(null);

  // Create/Edit form
  editingId = signal<string | null>(null);
  form = this.fb.group({
    title: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    status: this.fb.control<ProjectStatus>('new', {
      validators: [Validators.required],
    }),
    createdAt: this.fb.control<string>(''), // yyyy-MM-dd from <input type="date">
    tagsCsv: this.fb.control<string>(''),
    notes: this.fb.control<string>(''),
  });

  // Files
  coverFile = signal<File | null>(null);
  thumbFile = signal<File | null>(null);
  coverPreview = signal<string | null>(null);

  // Options
  readonly statuses: ProjectStatus[] = [
    'new',
    'in-progress',
    'completed',
    'delivered',
  ];
  readonly years = (() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => now - i);
  })();
  readonly months = [
    { v: 1, label: 'January' },
    { v: 2, label: 'February' },
    { v: 3, label: 'March' },
    { v: 4, label: 'April' },
    { v: 5, label: 'May' },
    { v: 6, label: 'June' },
    { v: 7, label: 'July' },
    { v: 8, label: 'August' },
    { v: 9, label: 'September' },
    { v: 10, label: 'October' },
    { v: 11, label: 'November' },
    { v: 12, label: 'December' },
  ];

  constructor() {
    effect(() => {
      const params = {
        page: this.page(),
        pageSize: this.pageSize(),
        q: this.q() || undefined,
        status: this.status() || undefined,
        year: this.year() || undefined,
        month: this.month() || undefined,
      };
      queueMicrotask(() => this.fetch(params));
    });
  }

  private fetch(params: {
    page: number;
    pageSize: number;
    q?: string;
    status?: ProjectStatus;
    year?: number;
    month?: number;
  }) {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(params).subscribe({
      next: (res) => {
        this.items.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load projects.');
        this.items.set([]);
        this.total.set(0);
        this.loading.set(false);
      },
    });
  }

  resetFilters() {
    this.q.set('');
    this.status.set('');
    this.year.set('');
    this.month.set('');
    this.page.set(1);
  }
  goto(p: number) {
    if (p >= 1 && p <= this.pages()) this.page.set(p);
  }
  trackById = (_: number, it: Project) => (it.id || it._id)!;

  ageFrom(iso: string): string {
    const t = +new Date(iso);
    if (!Number.isFinite(t)) return '';
    const diff = Date.now() - t;
    const d = Math.floor(diff / 86400000);
    if (d <= 0) {
      const h = Math.floor(diff / 3600000);
      if (h <= 0) return `${Math.floor(diff / 60000)}m ago`;
      return `${h}h ago`;
    }
    if (d < 30) return `${d}d ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo ago`;
    return `${Math.floor(mo / 12)}y ago`;
  }

  // Normalize date-only 'YYYY-MM-DD' to ISO midnight UTC
  private toISODate(dateStr: string): string {
    if (!dateStr) return '';
    if (/\d{4}-\d{2}-\d{2}T/.test(dateStr))
      return new Date(dateStr).toISOString();
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return new Date(dateStr).toISOString();
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0)).toISOString();
  }

  onFile(kind: 'cover' | 'thumb', ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0] ?? null;
    if (kind === 'cover') {
      this.coverFile.set(file);
      this.coverPreview.set(file ? URL.createObjectURL(file) : null);
    } else {
      this.thumbFile.set(file);
    }
  }

  edit(p: Project) {
    this.editingId.set(String(p.id || p._id));
    this.form.reset({
      title: p.title ?? '',
      status: p.status ?? 'new',
      createdAt: p.createdAt
        ? new Date(p.createdAt).toISOString().slice(0, 10)
        : '',
      tagsCsv: (p.tags ?? []).join(', '),
      notes: p.notes ?? '',
    });
    this.coverFile.set(null);
    this.thumbFile.set(null);
    this.coverPreview.set(p.cover || null);
    try {
      window?.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch {}
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      status: 'new',
      createdAt: '',
      tagsCsv: '',
      notes: '',
    });
    this.coverFile.set(null);
    this.thumbFile.set(null);
    this.coverPreview.set(null);
  }

  buildFormData(): FormData {
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.set('title', v.title.trim());
    fd.set('status', v.status);
    if (v.createdAt) fd.set('createdAt', this.toISODate(v.createdAt));
    if (v.tagsCsv) fd.set('tags', v.tagsCsv);
    if (v.notes) fd.set('notes', v.notes);
    if (this.coverFile()) fd.set('cover', this.coverFile()!);
    if (this.thumbFile()) fd.set('thumb', this.thumbFile()!);
    return fd;
  }

  submit() {
    if (this.form.invalid) return;
    const id = this.editingId();
    const fd = this.buildFormData();

    if (!id) {
      if (!this.coverFile()) {
        this.error.set('Please select a cover image.');
        return;
      }
      this.api.create(fd).subscribe({
        next: () => {
          this.cancelEdit();
          this.page.set(1);
        },
        error: (e) => {
          this.error.set(e?.error?.message || 'Failed to create.');
        },
      });
    } else {
      this.api.update(id, fd).subscribe({
        next: () => {
          this.cancelEdit();
          this.fetch({
            page: this.page(),
            pageSize: this.pageSize(),
            q: this.q() || undefined,
            status: this.status() || undefined,
            year: this.year() || undefined,
            month: this.month() || undefined,
          });
        },
        error: (e) => {
          this.error.set(e?.error?.message || 'Failed to update.');
        },
      });
    }
  }

  remove(it: Project) {
    const id = String(it.id || it._id || '');
    if (!id) return;
    if (!confirm(`Delete "${it.title}"?`)) return;

    this.api.remove(id).subscribe({
      next: () => {
        this.items.update((xs) =>
          xs.filter((x) => String(x.id || x._id) !== id)
        );
        this.total.update((n) => Math.max(0, n - 1));
        queueMicrotask(() => {
          if (this.items().length === 0 && this.page() > 1)
            this.page.set(this.page() - 1);
        });
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to delete project.');
      },
    });
  }

  onSearchEnter(ev: Event) {
    const val = (ev.target as HTMLInputElement | null)?.value ?? '';
    this.q.set(val);
    this.page.set(1);
  }

  /** Opens the native date picker (Chrome/Safari) or focuses input elsewhere */
  openDate(inputEl: HTMLInputElement) {
    const anyEl = inputEl as any;
    if (typeof anyEl.showPicker === 'function') {
      anyEl.showPicker();
    } else {
      try {
        inputEl.focus();
        inputEl.click();
      } catch {
        inputEl.focus();
      }
    }
  }
}
