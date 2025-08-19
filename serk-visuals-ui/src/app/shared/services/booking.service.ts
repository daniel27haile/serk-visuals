import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../../../environment/environment";
import {
  Booking,
  BookingCreateDto,
  BookingStatus,
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private http = inject(HttpClient);
  // private readonly base = `${environment.apiBaseUrl}/bookings`;
  private  base = `${environment.apiBaseUrl}/bookings`;

  /** POST /api/bookings */
  create(payload: BookingCreateDto): Observable<Booking> {
    return this.http.post<Booking>(this.base, payload);
  }

  /** GET /api/bookings */
  list(
    params?: Record<string, string | number | boolean>
  ): Observable<Booking[]> {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(
      ([k, v]) => (httpParams = httpParams.set(k, String(v)))
    );
    return this.http.get<Booking[]>(this.base, { params: httpParams });
  }

  /** GET /api/bookings/:id */
  getOne(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/${id}`);
  }

  /** PATCH /api/bookings/:id */
  update(id: string, patch: Partial<Booking>): Observable<Booking> {
    return this.http.patch<Booking>(`${this.base}/${id}`, patch);
  }

  /** PATCH /api/bookings/:id/status */
  setStatus(id: string, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(`${this.base}/${id}/status`, { status });
  }

  /** DELETE /api/bookings/:id */
  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${this.base}/${id}`);
  }
}
