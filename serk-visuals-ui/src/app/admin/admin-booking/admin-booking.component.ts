import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AdminApiService } from '../admin-shared/booking/booking.service';
import {
  Booking,
  BookingStatus,
  PagedResult,
} from '../admin-shared/booking/models';

@Component({
  selector: 'app-admin-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-booking.component.html',
  styleUrls: ['./admin-booking.component.scss'],
})
export class AdminBookingComponent implements OnInit {
  private api = inject(AdminApiService);

  loading = signal(true);
  error = signal<string | null>(null);
  items = signal<Booking[]>([]);

  // server-side filters
  q = new FormControl<string>('', { nonNullable: true });
  status = new FormControl<string>('', { nonNullable: true });
  type = new FormControl<string>('', { nonNullable: true });
  from = new FormControl<string>('', { nonNullable: true });
  to = new FormControl<string>('', { nonNullable: true });

  page = 1;
  pageSize = 10;
  total = 0;
  pages = 1;
  sort: string = '-createdAt';

  // selection map for bulk ops
  selection: Record<string, boolean> = {};
  allSelected = false;

  ngOnInit() {
    this.fetch({ page: 1 });
    this.q.valueChanges.subscribe(() => this.fetch({ page: 1 }));
    this.status.valueChanges.subscribe(() => this.fetch({ page: 1 }));
    this.type.valueChanges.subscribe(() => this.fetch({ page: 1 }));
    this.from.valueChanges.subscribe(() => this.fetch({ page: 1 }));
    this.to.valueChanges.subscribe(() => this.fetch({ page: 1 }));
  }

  fetch(opts: Partial<{ page: number }> = {}) {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .getBookings({
        q: this.q.value || undefined,
        status: this.status.value || undefined,
        type: this.type.value || undefined,
        from: this.from.value || undefined,
        to: this.to.value || undefined,
        page: opts.page ?? this.page,
        pageSize: this.pageSize,
        sort: this.sort,
      })
      .subscribe({
        next: (res: PagedResult<Booking> & { page?: number }) => {
          const normalized = (res.items ?? []).map((b) =>
            b.id || !b._id ? b : { ...b, id: b._id }
          );
          this.items.set(normalized);
          this.total = res.total ?? normalized.length;
          this.page = res.page ?? 1;
          this.pages = Math.max(1, Math.ceil(this.total / this.pageSize));

          // reset selection state
          this.selection = {};
          this.allSelected = false;
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Failed to load bookings.');
          this.loading.set(false);
        },
      });
  }

  goto(p: number) {
    if (p < 1 || p > this.pages) return;
    this.fetch({ page: p });
  }

  sortBy(key: string) {
    this.sort = this.sort === key ? `-${key}` : key;
    this.fetch({ page: this.page });
  }

  idOf(b: Booking): string {
    return (b.id ?? b._id ?? '') as string;
  }

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const map: Record<string, boolean> = {};
    for (const b of this.items()) {
      const id = this.idOf(b);
      if (id) map[id] = checked;
    }
    this.selection = map;
    this.allSelected = checked;
  }

  onRowToggle(_b: Booking, _checked: boolean) {
    const all = this.items();
    this.allSelected =
      all.length > 0 && all.every((x) => this.selection[this.idOf(x)]);
  }

  hasSelection() {
    return Object.values(this.selection).some(Boolean);
  }

  idsSelected() {
    return Object.entries(this.selection)
      .filter(([, v]) => v)
      .map(([id]) => id);
  }

  setStatus(b: Booking, s: BookingStatus) {
    const id = this.idOf(b);
    if (!id) return;
    const prev = b.status;
    b.status = s;
    this.items.set([...this.items()]); // optimistic

    this.api.updateBookingStatus(id, s).subscribe({
      error: (e) => {
        console.error(e);
        b.status = prev; // rollback
        this.items.set([...this.items()]);
      },
    });
  }

  bulkStatus(s: BookingStatus) {
    const ids = this.idsSelected();
    if (!ids.length) return;
    this.api.bulkSetStatus(ids, s).subscribe({
      next: () => this.fetch({ page: this.page }),
      error: (e) => console.error(e),
    });
  }

  bulkDelete() {
    const ids = this.idsSelected();
    if (!ids.length) return;
    this.api.bulkDelete(ids).subscribe({
      next: () => {
        this.selection = {};
        this.allSelected = false;
        this.fetch({ page: 1 });
      },
      error: (e) => console.error(e),
    });
  }

  export() {
    this.api
      .exportCsv({
        q: this.q.value,
        status: this.status.value,
        type: this.type.value,
        from: this.from.value,
        to: this.to.value,
      })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookings.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
