import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Booking,
  BookingCreateDto,
  BookingStatus,
} from '../models/booking.model';

// Use Angular proxy: /api -> http://localhost:3500
const BASE = 'http://localhost:3500/api/bookings';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private http = inject(HttpClient);

  create(payload: BookingCreateDto): Observable<Booking> {
    return this.http.post<Booking>(BASE, payload);
  }

  list(
    params?: Record<string, string | number | boolean>
  ): Observable<Booking[]> {
    let hp = new HttpParams();
    Object.entries(params ?? {}).forEach(
      ([k, v]) => (hp = hp.set(k, String(v)))
    );
    return this.http.get<Booking[]>(BASE, { params: hp });
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
