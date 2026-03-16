import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Paged,
  Testimonial,
  TestimonialCreateDTO,
  TestimonialUpdateDTO,
} from '../models/testimonial.model';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/api/testimonials`;

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private http = inject(HttpClient);

  list(opts?: {
    page?: number;
    limit?: number;
    sort?: string;
    published?: boolean;
    q?: string;
  }): Observable<Paged<Testimonial>> {
    let params = new HttpParams();
    Object.entries(opts || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<Paged<Testimonial>>(BASE, { params });
  }

  get(id: string): Observable<Testimonial> {
    return this.http.get<Testimonial>(`${BASE}/${id}`);
  }

  create(payload: TestimonialCreateDTO): Observable<Testimonial> {
    return this.http.post<Testimonial>(BASE, payload, { withCredentials: true });
  }

  update(id: string, patch: TestimonialUpdateDTO): Observable<Testimonial> {
    return this.http.patch<Testimonial>(`${BASE}/${id}`, patch, { withCredentials: true });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`, { withCredentials: true });
  }
}
