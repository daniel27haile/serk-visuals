import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  imports: [CommonModule],
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

  recentBookings = computed(() => this.bookings().slice(0, 5));
  latestMessages = computed(() => this.contacts().slice(0, 5));

  async ngOnInit() {
    // Avoid SSR network calls
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { bookings, contacts } = await firstValueFrom(
        forkJoin({
          bookings: this.api.getBookings({
            page: 1,
            pageSize: 10,
            sort: '-createdAt',
          }),
          contacts: this.api.getContacts({
            page: 1,
            pageSize: 10,
            sort: '-createdAt',
          }),
        })
      );

      this.bookings.set(this.ensureIds(this.normalize(bookings)));
      this.contacts.set(this.ensureIds(this.normalize(contacts)));
    } catch (e) {
      console.error(e);
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
