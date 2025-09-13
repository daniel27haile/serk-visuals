import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ContactItem, ContactListResponse } from './contact-us.types';

@Injectable({ providedIn: 'root' })
export class ContactUsService {
  private http = inject(HttpClient);
  // Keep your base URL as-is; change to '/api/contact' if you reverse-proxy
  private baseUrl = 'http://localhost:3500/api/contact';

  list(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    q?: string;
  }): Observable<ContactListResponse> {
    let p = new HttpParams();
    if (params.page) p = p.set('page', params.page);
    if (params.pageSize) p = p.set('pageSize', params.pageSize);
    if (params.status) p = p.set('status', params.status);
    if (params.q) p = p.set('q', params.q);
    return this.http.get<ContactListResponse>(this.baseUrl, { params: p });
  }

  get(id: string): Observable<ContactItem> {
    return this.http.get<ContactItem>(`${this.baseUrl}/${id}`);
  }

  update(
    id: string,
    payload: Partial<
      Pick<
        ContactItem,
        'fullName' | 'email' | 'subject' | 'message' | 'reply' | 'status'
      >
    >
  ): Observable<ContactItem> {
    return this.http
      .patch<{ message: string; data: ContactItem }>(
        `${this.baseUrl}/${id}`,
        payload
      )
      .pipe(map((r) => r.data));
  }

  updateStatus(
    id: string,
    status: 'new' | 'read' | 'replied'
  ): Observable<ContactItem> {
    return this.http
      .patch<{ message: string; data: ContactItem }>(
        `${this.baseUrl}/${id}/status`,
        { status }
      )
      .pipe(map((r) => r.data));
  }

  softDelete(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(
      `${this.baseUrl}/${id}`
    );
  }

  hardDelete(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(
      `${this.baseUrl}/${id}/hard`
    );
  }
}
