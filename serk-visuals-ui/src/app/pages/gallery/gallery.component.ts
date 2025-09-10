import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../shared/services/gallery.service';
import { Album, GalleryItem } from '../../shared/models/gallery.model';
import { firstValueFrom } from 'rxjs';

type Paged<T> = { items: T[]; total: number; page: number; pages: number };

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryPage {
  private api = inject(GalleryService);

  albums: Album[] = [
    'wedding',
    'event',
    'birthday',
    'product',
    'personal',
    'other',
  ];
  album = signal<Album | ''>(''); // '' = all
  page = signal(1);
  limit = signal(24);
  loading = signal(true);
  error = signal<string | null>(null);

  items = signal<GalleryItem[]>([]);
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  constructor() {
    effect(
      () => {
        // react to album/page changes
        void this.fetch();
      },
      { allowSignalWrites: true }
    );
  }

  private async fetch() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.list({
          album: (this.album() || undefined) as Album | undefined,
          published: true,
          page: this.page(),
          limit: this.limit(),
        })
      );
      this.items.set(res.items ?? []);
      this.total.set(res.total ?? 0);
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.error?.message || 'Failed to load gallery.');
      this.items.set([]);
      this.total.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  setAlbum(a: Album | '') {
    this.album.set(a);
    this.page.set(1);
  }

  goto(p: number) {
    if (p < 1 || p > this.pages()) return;
    this.page.set(p);
  }

  trackById = (_: number, it: GalleryItem) => it._id!;

  /** Safely join tags for template usage */
  joinTags(tags?: string[] | null): string {
    return Array.isArray(tags) && tags.length ? tags.join(', ') : '';
  }
}
