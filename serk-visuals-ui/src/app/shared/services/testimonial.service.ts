import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Paged,
  Testimonial,
  TestimonialCreateDTO,
  TestimonialUpdateDTO,
} from '../models/testimonial.model';

// Adjust to your env if needed
const BASE = 'http://localhost:3500/api/testimonials';

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private http = inject(HttpClient);

  list(opts?: {
    page?: number;
    limit?: number;
    sort?: string; // e.g. 'order,-createdAt'
    published?: boolean; // optional filter
    q?: string; // optional search
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
    const fd = new FormData();
    fd.set('author', payload.author);
    fd.set('quote', payload.quote);
    if (payload.role) fd.set('role', payload.role);
    if (typeof payload.published === 'boolean') {
      fd.set('published', String(payload.published));
    }
    if (typeof payload.order === 'number') {
      fd.set('order', String(payload.order));
    }
    if (payload.avatar instanceof File) {
      fd.set('avatar', payload.avatar);
    }
    return this.http.post<Testimonial>(BASE, fd);
  }

  update(id: string, patch: TestimonialUpdateDTO): Observable<Testimonial> {
    const fd = new FormData();
    if (patch.author) fd.set('author', patch.author);
    if (patch.quote) fd.set('quote', patch.quote);
    if (patch.role) fd.set('role', patch.role);
    if (typeof patch.published === 'boolean') {
      fd.set('published', String(patch.published));
    }
    if (typeof patch.order === 'number') {
      fd.set('order', String(patch.order));
    }
    if (patch.avatar instanceof File) {
      fd.set('avatar', patch.avatar);
    }
    return this.http.patch<Testimonial>(`${BASE}/${id}`, fd);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
