import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import {
  ProjectsService,
  Project,
  ProjectStatus,
} from './projects.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TimeAgoPipe, DatePipe],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnDestroy {
  private fb  = inject(NonNullableFormBuilder);
  private api = inject(ProjectsService);

  // ── Filters / paging ─────────────────────────────────────
  q         = signal<string>('');
  status    = signal<ProjectStatus | ''>('');
  year      = signal<number | ''>('');
  month     = signal<number | ''>('');
  page      = signal(1);
  pageSize  = signal(10);

  // ── Data ─────────────────────────────────────────────────
  items   = signal<Project[]>([]);
  total   = signal(0);
  pages   = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  loading = signal(false);
  saving  = signal(false);
  error   = signal<string | null>(null);

  // ── Create / Edit form ───────────────────────────────────
  editingId = signal<string | null>(null);
  form = this.fb.group({
    title:     this.fb.control('', [Validators.required, Validators.minLength(2)]),
    status:    this.fb.control<ProjectStatus>('new', { validators: [Validators.required] }),
    createdAt: this.fb.control<string>(''),
    tagsCsv:   this.fb.control<string>(''),
    notes:     this.fb.control<string>(''),
  });

  // ── Detail modal ─────────────────────────────────────────
  detailProject = signal<Project | null>(null);

  // ── Options ──────────────────────────────────────────────
  readonly statuses: ProjectStatus[] = ['new', 'in-progress', 'completed', 'delivered'];
  readonly years = (() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => now - i);
  })();
  readonly months = [
    { v: 1,  label: 'January'   },
    { v: 2,  label: 'February'  },
    { v: 3,  label: 'March'     },
    { v: 4,  label: 'April'     },
    { v: 5,  label: 'May'       },
    { v: 6,  label: 'June'      },
    { v: 7,  label: 'July'      },
    { v: 8,  label: 'August'    },
    { v: 9,  label: 'September' },
    { v: 10, label: 'October'   },
    { v: 11, label: 'November'  },
    { v: 12, label: 'December'  },
  ];

  constructor() {
    effect(() => {
      const params = {
        page:     this.page(),
        pageSize: this.pageSize(),
        q:        this.q()      || undefined,
        status:   this.status() || undefined,
        year:     this.year()   || undefined,
        month:    this.month()  || undefined,
      };
      queueMicrotask(() => this.fetch(params));
    });
  }

  ngOnDestroy() {
    this.lockScroll(false);
  }

  @HostListener('document:keydown.escape')
  onEscKey() {
    if (this.detailProject()) this.closeDetail();
  }

  // ── Detail modal ─────────────────────────────────────────
  openDetail(p: Project) {
    this.detailProject.set(p);
    this.lockScroll(true);
  }

  closeDetail() {
    this.detailProject.set(null);
    this.lockScroll(false);
  }

  private lockScroll(on: boolean) {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = on ? 'hidden' : '';
  }

  // ── Private fetch ────────────────────────────────────────
  private fetch(params: {
    page: number; pageSize: number;
    q?: string; status?: ProjectStatus; year?: number; month?: number;
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

  // ── Filter / paging helpers ──────────────────────────────
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

  // ── Edit helpers ─────────────────────────────────────────
  edit(p: Project) {
    const rawId = p.id || p._id || null;
    this.editingId.set(rawId ? String(rawId) : null);
    this.form.reset({
      title:     p.title  ?? '',
      status:    p.status ?? 'new',
      createdAt: '',          // hidden in edit mode; original timestamp preserved on server
      tagsCsv:   (p.tags ?? []).join(', '),
      notes:     p.notes  ?? '',
    });
    try { window?.scrollTo?.({ top: 0, behavior: 'smooth' }); } catch {}
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({ title: '', status: 'new', createdAt: '', tagsCsv: '', notes: '' });
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const id = this.editingId();
    const v  = this.form.getRawValue();

    this.saving.set(true);
    this.error.set(null);

    // createdAt is only sent on create; editing never changes the original timestamp
    const payload = id
      ? {
          title:  v.title.trim(),
          status: v.status,
          tags:   v.tagsCsv || undefined,
          notes:  v.notes   || undefined,
        }
      : {
          title:     v.title.trim(),
          status:    v.status,
          tags:      v.tagsCsv || undefined,
          notes:     v.notes   || undefined,
          createdAt: v.createdAt ? this.toLocalISODate(v.createdAt) : undefined,
        };

    const req$ = id ? this.api.update(id, payload) : this.api.create(payload);

    req$.subscribe({
      next: () => {
        this.cancelEdit();
        this.fetch({
          page:     this.page(),
          pageSize: this.pageSize(),
          q:        this.q()      || undefined,
          status:   this.status() || undefined,
          year:     this.year()   || undefined,
          month:    this.month()  || undefined,
        });
        this.saving.set(false);
      },
      error: (e) => {
        if (e?.status === 404) this.editingId.set(null);
        this.error.set(e?.error?.message || (id ? 'Failed to update.' : 'Failed to create.'));
        this.saving.set(false);
      },
    });
  }

  remove(it: Project) {
    const id = String(it.id || it._id || '');
    if (!id) return;
    if (!confirm(`Delete "${it.title}"?`)) return;

    this.api.remove(id).subscribe({
      next: () => {
        this.items.update((xs) => xs.filter((x) => String(x.id || x._id) !== id));
        this.total.update((n) => Math.max(0, n - 1));
        queueMicrotask(() => {
          if (this.items().length === 0 && this.page() > 1) this.page.set(this.page() - 1);
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

  openDate(inputEl: HTMLInputElement) {
    const anyEl = inputEl as any;
    if (typeof anyEl.showPicker === 'function') {
      anyEl.showPicker();
    } else {
      try { inputEl.focus(); inputEl.click(); } catch { inputEl.focus(); }
    }
  }

  /** Converts a YYYY-MM-DD string from the date picker to an ISO string at local midnight. */
  private toLocalISODate(dateStr: string): string {
    if (!dateStr) return '';
    if (/\d{4}-\d{2}-\d{2}T/.test(dateStr)) return new Date(dateStr).toISOString();
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return new Date(dateStr).toISOString();
    // new Date(y, m-1, d) uses local time, not UTC — avoids timezone-shift bug
    return new Date(y, m - 1, d, 0, 0, 0).toISOString();
  }
}
