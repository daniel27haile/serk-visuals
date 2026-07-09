import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AdminApiService } from '../admin-shared/booking/booking.service';
import {
  Booking,
  ContactMessage,
  PagedResult,
} from '../admin-shared/booking/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private api = inject(AdminApiService);
  private platformId = inject(PLATFORM_ID);

  loading = signal(true);
  error = signal<string | null>(null);

  bookings = signal<Booking[]>([]);
  contacts = signal<ContactMessage[]>([]);
  bookingsTotal = signal(0);
  contactsTotal = signal(0);

  recentBookings = computed(() => this.bookings().slice(0, 5));
  latestMessages = computed(() => this.contacts().slice(0, 5));

  pendingBookings = computed(() =>
    this.bookings().filter(
      (b) => !b.status || b.status === 'new' || b.status === 'pending'
    ).length
  );

  confirmedBookings = computed(() =>
    this.bookings().filter((b) => b.status === 'confirmed').length
  );

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const results = await firstValueFrom(
        forkJoin({
          bookings: this.api.getBookings({ page: 1, pageSize: 10, sort: '-createdAt' }),
          contacts: this.api.getContacts({ page: 1, pageSize: 10, sort: '-createdAt' }),
        })
      );

      // Extract totals from paged results
      const bResult = results.bookings as PagedResult<Booking> | Booking[];
      const cResult = results.contacts as PagedResult<ContactMessage> | ContactMessage[];

      this.bookingsTotal.set(Array.isArray(bResult) ? bResult.length : (bResult?.total ?? 0));
      this.contactsTotal.set(Array.isArray(cResult) ? cResult.length : (cResult?.total ?? 0));

      this.bookings.set(this.ensureIds(this.normalize(results.bookings)));
      this.contacts.set(this.ensureIds(this.normalize(results.contacts)));
    } catch (e) {
      this.error.set('Failed to load dashboard data.');
    } finally {
      this.loading.set(false);
    }
  }

  private normalize<T>(payload: PagedResult<T> | T[] | null | undefined): T[] {
    if (!payload) return [];
    return Array.isArray(payload) ? payload : payload.items ?? [];
  }

  private ensureIds<T extends { id?: string; _id?: string }>(arr: T[]): T[] {
    return arr.map((it) => (it.id || !it._id ? it : { ...it, id: it._id }));
  }

  idOf(b: { id?: string; _id?: string }, idx?: number) {
    return (b.id ?? b._id ?? idx ?? 0) as unknown as string | number;
  }

  refresh() {
    this.ngOnInit();
  }
}
