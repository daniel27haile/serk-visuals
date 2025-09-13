// src/app/shared/services/gallery.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Album, GalleryItem, Paged, Placement } from '../models/gallery.model';

// import { environment } from '../../../environment/environment';
// const baseUrl = `${environment.apiBaseUrl}/gallery`;
const baseUrl = 'http://localhost:3500/api/gallery';

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
    placement?: Placement; // 👈 new
    sort?: string; // e.g. 'order,-createdAt'
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

  // multipart create
  create(form: {
    title: string;
    album: Album;
    tags?: string[] | string;
    published?: boolean;
    image: File;
    thumb?: File;
    placement?: Placement; // 👈 new
    order?: number; // 👈 new
  }) {
    const fd = new FormData();
    fd.set('title', form.title);
    fd.set('album', form.album);
    if (Array.isArray(form.tags)) fd.set('tags', form.tags.join(','));
    else if (form.tags) fd.set('tags', form.tags);
    if (typeof form.published === 'boolean')
      fd.set('published', String(form.published));
    fd.set('image', form.image);
    if (form.thumb) fd.set('thumb', form.thumb);
    if (form.placement) fd.set('placement', form.placement);
    if (typeof form.order === 'number') fd.set('order', String(form.order));
    return this.http.post<GalleryItem>(this.base, fd);
  }

  // multipart update (optional files)
  update(
    id: string,
    patch: Partial<Omit<GalleryItem, 'url' | 'thumbnail'>> & {
      image?: File;
      thumb?: File;
    }
  ) {
    const fd = new FormData();
    if (patch.title) fd.set('title', patch.title);
    if (patch.album) fd.set('album', patch.album);
    if (typeof patch.published === 'boolean')
      fd.set('published', String(patch.published));
    if (Array.isArray(patch.tags)) fd.set('tags', patch.tags.join(','));
    if (patch.image) fd.set('image', patch.image);
    if (patch.thumb) fd.set('thumb', patch.thumb);
    if (patch.placement) fd.set('placement', patch.placement);
    if (typeof patch.order === 'number') fd.set('order', String(patch.order));
    return this.http.patch<GalleryItem>(`${this.base}/${id}`, fd);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
