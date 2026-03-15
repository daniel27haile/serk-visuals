// src/app/shared/services/gallery.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Album, GalleryItem, Paged, Placement } from '../models/gallery.model';
import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiUrl}/api/gallery`;

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private http = inject(HttpClient);
  private base = baseUrl;

  list(opts?: {
    album?: Album;
    q?: string;
    page?: number;
    limit?: number;
    published?: boolean;
    placement?: Placement;
    sort?: string;
  }): Observable<Paged<GalleryItem>> {
    let params = new HttpParams();
    Object.entries(opts || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<Paged<GalleryItem>>(this.base, { params });
  }

  get(id: string) {
    return this.http.get<GalleryItem>(`${this.base}/${id}`);
  }

  /** Create: expects S3 keys obtained from UploadService */
  create(form: {
    title: string;
    album: Album;
    tags?: string[] | string;
    published?: boolean;
    imageKey: string;
    thumbKey?: string;
    placement?: Placement;
    order?: number;
  }): Observable<GalleryItem> {
    return this.http.post<GalleryItem>(this.base, form, {
      withCredentials: true,
    });
  }

  /** Update: pass imageKey/thumbKey only when replacing the image */
  update(
    id: string,
    patch: Partial<Omit<GalleryItem, 'url' | 'thumbnail'>> & {
      imageKey?: string;
      thumbKey?: string;
    }
  ): Observable<GalleryItem> {
    return this.http.patch<GalleryItem>(`${this.base}/${id}`, patch, {
      withCredentials: true,
    });
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`, {
      withCredentials: true,
    });
  }
}
