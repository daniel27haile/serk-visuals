import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Booking, ContactMessage, PagedResult } from './models';
import { BookingStatus } from './models';

// Angular dev proxy: /api -> http://localhost:3500
const API_BASE = 'http://localhost:3500/api';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);

  /** GET /api/bookings */
  getBookings(params?: {
    q?: string;
    status?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
  }): Observable<PagedResult<Booking>> {
    let hp = new HttpParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    });

    return this.http
      .get<Booking[] | PagedResult<Booking>>(`${API_BASE}/bookings`, {
        params: hp,
      })
      .pipe(
        map((res) =>
          Array.isArray(res) ? { items: res, total: res.length } : res
        )
      );
  }

  /** GET /api/contact */
  getContacts(params?: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
  }): Observable<PagedResult<ContactMessage>> {
    let hp = new HttpParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    });

    return this.http
      .get<ContactMessage[] | PagedResult<ContactMessage>>(
        `${API_BASE}/contact`,
        { params: hp }
      )
      .pipe(
        map((res) =>
          Array.isArray(res) ? { items: res, total: res.length } : res
        )
      );
  }

  /** PATCH /api/bookings/:id (status) */
  updateBookingStatus(id: string, status: BookingStatus) {
    return this.http.patch<Booking>(`${API_BASE}/bookings/${id}/status`, {
      status,
    });
  }

  /** PATCH /api/bookings/bulk/status */
  bulkSetStatus(ids: string[], status: BookingStatus) {
    return this.http.patch<{
      matched: number;
      modified: number;
      status: BookingStatus;
    }>(`${API_BASE}/bookings/bulk/status`, { ids, status });
  }

  /** DELETE /api/bookings/bulk */
  bulkDelete(ids: string[]) {
    return this.http.request<{ deleted: number }>(
      'delete',
      `${API_BASE}/bookings/bulk`,
      {
        body: { ids },
      }
    );
  }

  /** GET /api/bookings/export.csv */
  exportCsv(filters: {
    q?: string;
    status?: string;
    type?: string;
    from?: string;
    to?: string;
  }) {
    let hp = new HttpParams();
    Object.entries(filters ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    });
    return this.http.get(`${API_BASE}/bookings/export.csv`, {
      params: hp,
      responseType: 'blob',
    });
  }
}
