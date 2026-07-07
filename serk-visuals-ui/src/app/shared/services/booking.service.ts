import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Booking,
  BookingCreateDto,
  BookingStatus,
  SlotDay,
  SlotsResponse,
  DayAvailability,
  MonthAvailability,
} from '../models/booking.model';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/api/bookings`;

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private http = inject(HttpClient);

  create(payload: BookingCreateDto): Observable<Booking> {
    return this.http.post<Booking>(BASE, payload);
  }

  // Availability helper for the form (live check)
  checkAvailability(opts: {
    date: string;
    time?: string;
    durationMinutes?: number;
  }) {
    let params = new HttpParams().set('date', opts.date);
    if (opts.time) params = params.set('time', opts.time);
    if (opts.durationMinutes)
      params = params.set('durationMinutes', String(opts.durationMinutes));
    return this.http.get<{ available: boolean; conflict?: any }>(
      `${BASE}/availability`,
      { params }
    );
  }

  /** GET /api/bookings/availability — returns available/taken/unavailable slots. duration in hours. */
  getDayAvailability(date: string, durationHours: number): Observable<DayAvailability> {
    const params = new HttpParams()
      .set('date', date)
      .set('duration', String(durationHours));
    return this.http.get<DayAvailability>(`${BASE}/availability`, { params });
  }

  /** GET /api/bookings/month-availability — returns day statuses. duration in hours. */
  getMonthAvailability(month: string, durationHours: number): Observable<MonthAvailability> {
    const params = new HttpParams()
      .set('month', month)
      .set('duration', String(durationHours));
    return this.http.get<MonthAvailability>(`${BASE}/month-availability`, { params });
  }

  /** GET /api/bookings/next-availability — duration in hours. */
  getNextAvailability(durationHours: number, limit = 7): Observable<SlotDay[]> {
    const params = new HttpParams()
      .set('duration', String(durationHours))
      .set('limit', String(limit));
    return this.http.get<SlotDay[]>(`${BASE}/next-availability`, { params });
  }

  /** Legacy: GET /api/bookings/slots — duration in minutes. */
  getSlots(date: string, durationMinutes: number): Observable<SlotsResponse> {
    const params = new HttpParams()
      .set('date', date)
      .set('duration', String(durationMinutes));
    return this.http.get<SlotsResponse>(`${BASE}/slots`, { params });
  }

  list(
    params?: Record<string, string | number | boolean>
  ): Observable<Booking[]> {
    let hp = new HttpParams();
    Object.entries(params ?? {}).forEach(
      ([k, v]) => (hp = hp.set(k, String(v)))
    );
    // NOTE: your backend returns {items,total,...}. Keep your existing calls in admin as-is;
    // this list() is currently used seldomly; adapt if needed.
    return this.http
      .get<{ items: Booking[] }>(BASE, { params: hp })
      .pipe(map((r) => r.items));
  }

  getOne(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${BASE}/${id}`);
  }

  update(id: string, patch: Partial<Booking>): Observable<Booking> {
    return this.http.patch<Booking>(`${BASE}/${id}`, patch);
  }

  setStatus(id: string, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(`${BASE}/${id}/status`, { status });
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${BASE}/${id}`);
  }
}
