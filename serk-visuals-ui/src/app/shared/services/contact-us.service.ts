// src/app/contact-us/contact-us.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ContactRequest, ContactResponse } from '../models/contact-us.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactUsService {
  private http = inject(HttpClient);

  private base = `${environment.apiUrl}/api/contact`;

  /**
   * Posts a contact request to your backend.
   * Backend route: app.use("/api/contact", contactUsRoutes)
   * Controller: POST /api/contact
   */

  create(payload: ContactRequest): Observable<ContactResponse> {
    const body = { ...payload, hp: payload.hp ?? '' };
    return this.http.post<ContactResponse>(this.base, body);
  }

  // Optional: add methods to get messages, etc., if needed

  getAll(): Observable<ContactResponse[]> {
    return this.http.get<ContactResponse[]>(this.base);
  }
  getOne(id: string): Observable<ContactResponse> {
    return this.http.get<ContactResponse>(`${this.base}/${id}`);
  }
}
