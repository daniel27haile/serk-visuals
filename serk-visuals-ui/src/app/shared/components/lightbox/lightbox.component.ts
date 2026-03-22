import {
  Component,
  signal,
  computed,
  Output,
  EventEmitter,
  inject,
  OnDestroy,
  PLATFORM_ID,
  HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GalleryItem } from '../../models/gallery.model';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss'],
})
export class LightboxComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);
  items = signal<GalleryItem[]>([]);
  idx = signal(0);

  curr = computed<GalleryItem | null>(() => {
    const arr = this.items();
    const i = this.idx();
    return i >= 0 && i < arr.length ? arr[i] : null;
  });

  private _prevOverflow: string | undefined;

  open(list: GalleryItem[], startIndex = 0) {
    if (!list.length) return;
    this.items.set(list);
    this.idx.set(Math.max(0, Math.min(startIndex, list.length - 1)));
    this.isOpen.set(true);
    this.lockScroll(true);
    this.opened.emit();
    if (this.isBrowser) {
      setTimeout(() => document.getElementById('lb-root')?.focus(), 0);
    }
  }

  close() {
    this.isOpen.set(false);
    this.lockScroll(false);
    this.closed.emit();
  }

  next() {
    const len = this.items().length || 1;
    this.idx.update(i => (i + 1) % len);
  }

  prev() {
    const len = this.items().length || 1;
    this.idx.update(i => (i - 1 + len) % len);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.isOpen()) return;
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }

  ngOnDestroy() {
    this.lockScroll(false);
  }

  private lockScroll(on: boolean) {
    if (!this.isBrowser) return;
    const root = document.documentElement;
    if (on) {
      this._prevOverflow = root.style.overflow;
      root.style.overflow = 'hidden';
    } else {
      root.style.overflow = this._prevOverflow ?? '';
    }
  }
}
