import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ProjectStatus = 'new' | 'in-progress' | 'completed' | 'delivered';

export interface Project {
  id?: string;
  _id?: string;
  title: string;
  status: ProjectStatus;
  cover: string; // absolute URL from API
  thumbnail?: string | null;
  tags?: string[];
  notes?: string | null;
  createdAt: string; // ISO
  updatedAt?: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);

  // Prefer env; fallback to localhost
  private readonly BASE =
    (typeof window !== 'undefined' &&
      (window as any).__env?.API_URL?.replace(/\/$/, '')) ||
    'http://localhost:3500/api/projects';

  list(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: ProjectStatus | '';
    year?: number | '';
    month?: number | '';
  }): Observable<ProjectListResponse> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    }
    return this.http.get<ProjectListResponse>(this.BASE, {
      params: hp,
      withCredentials: true, // send auth cookie
    });
  }

  create(fd: FormData): Observable<Project> {
    return this.http.post<Project>(this.BASE, fd, { withCredentials: true });
  }

  update(id: string, fd: FormData): Observable<Project> {
    return this.http.patch<Project>(`${this.BASE}/${id}`, fd, {
      withCredentials: true,
    });
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${this.BASE}/${id}`, {
      withCredentials: true,
    });
  }
}
