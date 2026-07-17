import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { REPortfolioProject, REPortfolioPaged } from '../models/re-portfolio.model';

const PUBLIC_BASE = `${environment.apiUrl}/portfolio/real-estate`;
const ADMIN_BASE  = `${environment.apiUrl}/admin/portfolio/real-estate`;

@Injectable({ providedIn: 'root' })
export class RePortfolioService {
  private http = inject(HttpClient);

  // ── Public ────────────────────────────────────────────────────────────────

  list(opts?: { page?: number; limit?: number; featured?: boolean }): Observable<REPortfolioPaged> {
    let params = new HttpParams();
    if (opts?.page)              params = params.set('page',     String(opts.page));
    if (opts?.limit)             params = params.set('limit',    String(opts.limit));
    if (opts?.featured != null)  params = params.set('featured', String(opts.featured));
    return this.http.get<REPortfolioPaged>(PUBLIC_BASE, { params });
  }

  getBySlug(slug: string): Observable<REPortfolioProject> {
    return this.http.get<REPortfolioProject>(`${PUBLIC_BASE}/${slug}`);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  adminList(opts?: { page?: number; limit?: number; published?: boolean }): Observable<REPortfolioPaged> {
    let params = new HttpParams();
    if (opts?.page != null)      params = params.set('page',      String(opts.page));
    if (opts?.limit != null)     params = params.set('limit',     String(opts.limit));
    if (opts?.published != null) params = params.set('published', String(opts.published));
    return this.http.get<REPortfolioPaged>(ADMIN_BASE, { params, withCredentials: true });
  }

  adminGet(id: string): Observable<REPortfolioProject> {
    return this.http.get<REPortfolioProject>(`${ADMIN_BASE}/${id}`, { withCredentials: true });
  }

  adminCreate(data: object): Observable<REPortfolioProject> {
    return this.http.post<REPortfolioProject>(ADMIN_BASE, data, { withCredentials: true });
  }

  adminUpdate(id: string, patch: object): Observable<REPortfolioProject> {
    return this.http.patch<REPortfolioProject>(`${ADMIN_BASE}/${id}`, patch, { withCredentials: true });
  }

  adminDelete(id: string): Observable<void> {
    return this.http.delete<void>(`${ADMIN_BASE}/${id}`, { withCredentials: true });
  }

  adminAddImage(id: string, data: object): Observable<REPortfolioProject> {
    return this.http.post<REPortfolioProject>(`${ADMIN_BASE}/${id}/images`, data, { withCredentials: true });
  }

  adminRemoveImage(id: string, imgId: string): Observable<REPortfolioProject> {
    return this.http.delete<REPortfolioProject>(`${ADMIN_BASE}/${id}/images/${imgId}`, { withCredentials: true });
  }

  adminReorderImages(id: string, items: { id: string; order: number }[]): Observable<REPortfolioProject> {
    return this.http.patch<REPortfolioProject>(`${ADMIN_BASE}/${id}/images/reorder`, { items }, { withCredentials: true });
  }

  adminReorderProjects(items: { id: string; order: number }[]): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${ADMIN_BASE}/reorder`, { items }, { withCredentials: true });
  }
}
