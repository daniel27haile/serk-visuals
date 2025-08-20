// src/app/pages/gallery/gallery.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { startWith, switchMap, catchError, of, map } from 'rxjs';
import { GalleryService } from '../../shared/services/gallery.service';
import { Album, GalleryItem } from '../../shared/models/gallery.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryPage {
  private api = inject(GalleryService);

  albums: Album[] = ['wedding', 'event', 'birthday', 'product', 'personal', 'other'];
  album = signal<Album | ''>(''); // '' means “all”
  err = signal<string | null>(null);

  // Stream emits immediately (startWith) so toSignal needs no initialValue option.
  items = toSignal(
    toObservable(this.album).pipe(
      startWith(this.album()), // emit current album right away
      switchMap((alb) =>
        this.api
          .list({
            album: (alb || undefined) as Album | undefined,
            published: true,
            page: 1,
            limit: 48,
          })
          .pipe(
            map((res) => res.items as GalleryItem[]), // type the response
            catchError((e) => {
              this.err.set(e?.error?.message || 'Failed to load');
              return of([] as GalleryItem[]); // on error, empty list
            })
          )
      ),
      startWith([] as GalleryItem[]) // ensure a synchronous first value
    )
  );

  setAlbum(a: Album | '') {
    this.album.set(a);
  }
  trackById = (_: number, it: GalleryItem) => it._id!;
}
