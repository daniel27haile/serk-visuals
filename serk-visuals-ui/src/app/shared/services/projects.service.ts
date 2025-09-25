// shared/services/projects.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Project,
  ProjectCreateDto,
  ProjectListResponse,
  ProjectUpdateDto,
  ProjectStatus,
} from '../models/project.model';

const BASE = 'http://localhost:3500/api/projects';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);

  list(params?: {
    page?: number;
    limit?: number;
    status?: ProjectStatus | '';
    year?: number | '';
    month?: number | '';
    q?: string;
    sort?: string;
  }): Observable<ProjectListResponse> {
    let hp = new HttpParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    });
    return this.http.get<ProjectListResponse>(BASE, { params: hp });
  }

  getOne(id: string): Observable<Project> {
    return this.http.get<Project>(`${BASE}/${id}`);
  }

  create(payload: ProjectCreateDto): Observable<Project> {
    return this.http
      .post<{ message: string; data: Project }>(BASE, payload)
      .pipe(map((r) => r.data));
  }

  update(id: string, patch: ProjectUpdateDto): Observable<Project> {
    return this.http
      .patch<{ message: string; data: Project }>(`${BASE}/${id}`, patch)
      .pipe(map((r) => r.data));
  }

  updateStatus(id: string, status: ProjectStatus): Observable<Project> {
    return this.http
      .patch<{ message: string; data: Project }>(`${BASE}/${id}/status`, {
        status,
      })
      .pipe(map((r) => r.data));
  }

  softDelete(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${BASE}/${id}`);
  }

  hardDelete(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(
      `${BASE}/${id}/hard`
    );
  }
}
