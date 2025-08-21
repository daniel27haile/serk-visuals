import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Album, GalleryItem } from '../models/gallery.model';
import { environment } from '../../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/gallery`;

  list(opts?: {
    album?: Album;
    q?: string;
    page?: number;
    limit?: number;
    published?: boolean;
  }): Observable<{
    items: GalleryItem[];
    total: number;
    page: number;
    pages: number;
  }> {
    let params = new HttpParams();
    Object.entries(opts || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '')
        params = params.set(k, String(v));
    });
    return this.http.get<{
      items: GalleryItem[];
      total: number;
      page: number;
      pages: number;
    }>(this.base, { params });
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
    return this.http.post<GalleryItem>(this.base, fd);
  }

  // multipart update (optional new files)
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
    return this.http.patch<GalleryItem>(`${this.base}/${id}`, fd);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
