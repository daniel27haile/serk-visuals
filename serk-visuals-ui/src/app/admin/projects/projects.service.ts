import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ProjectStatus = 'new' | 'in-progress' | 'completed' | 'delivered';

export interface Project {
  id?: string;
  _id?: string;
  title: string;
  status: ProjectStatus;
  tags?: string[];
  notes?: string | null;
  /** ISO string from the server; always present on saved records */
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  pages: number;
}

export interface ProjectCreatePayload {
  title: string;
  status?: ProjectStatus;
  tags?: string;
  notes?: string;
  createdAt?: string;
}

export interface ProjectUpdatePayload {
  title?: string;
  status?: ProjectStatus;
  tags?: string;
  notes?: string;
  // createdAt intentionally omitted — editing never changes the original timestamp
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);

  private readonly BASE = `${environment.apiUrl}/api/projects`;

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
      withCredentials: true,
    });
  }

  create(payload: ProjectCreatePayload): Observable<Project> {
    return this.http.post<Project>(this.BASE, payload, { withCredentials: true });
  }

  update(id: string, payload: ProjectUpdatePayload): Observable<Project> {
    return this.http.patch<Project>(`${this.BASE}/${id}`, payload, { withCredentials: true });
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${this.BASE}/${id}`, { withCredentials: true });
  }
}
