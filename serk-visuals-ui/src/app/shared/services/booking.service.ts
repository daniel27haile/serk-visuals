import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingStatus } from '../models/booking.model';
import { environment } from "../../../../environment/environment";

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  // Normalize base (remove trailing slash if present)
  // private readonly base = (environment.apiBaseUrl || '').replace(/\/+$/, '');
  private readonly base = '/localhost:3500/api/';

  create(
    payload: Omit<Booking, '_id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: BookingStatus;
    }
  ): Observable<Booking> {
    return this.http.post<Booking>(this.base, payload);
  }

  list(opts?: {
    status?: BookingStatus;
    type?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Observable<{
    items: Booking[];
    total: number;
    page: number;
    pages: number;
  }> {
    let params = new HttpParams();
    Object.entries(opts || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '')
        params = params.set(k, String(v));
    });
    return this.http.get<{
      items: Booking[];
      total: number;
      page: number;
      pages: number;
    }>(this.base, { params });
  }

  get(id: string) {
    return this.http.get<Booking>(`${this.base}/${id}`);
  }

  update(id: string, patch: Partial<Booking>) {
    return this.http.patch<Booking>(`${this.base}/${id}`, patch);
  }

  setStatus(id: string, status: BookingStatus) {
    return this.http.patch<Booking>(`${this.base}/${id}/status`, { status });
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
