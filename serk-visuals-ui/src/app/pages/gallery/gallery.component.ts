import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GalleryService } from '../../shared/services/gallery.service';
import { Album, GalleryItem } from '../../shared/models/gallery.model';
import { firstValueFrom, fromEvent, Subscription } from 'rxjs';
import { skip, throttleTime } from 'rxjs/operators';
import { LightboxComponent } from '../../shared/components/lightbox/lightbox.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, LightboxComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryPage implements AfterViewInit, OnDestroy {
  private api = inject(GalleryService);
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ------- filters / paging -------
  albums: Album[] = [
    'Wedding',
    'Event',
    'Birthday',
    'Product',
    'Personal',
    'Other',
  ];
  album = signal<Album | ''>(''); // '' = all
  page = signal(1);
  limit = signal(24);
  loading = signal(true);
  error = signal<string | null>(null);

  items = signal<GalleryItem[]>([]);
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  /** pill icons */
  private readonly albumIcons: Record<Album, string> = {
    Wedding: '💍',
    Event: '🎪',
    Birthday: '🎂',
    Product: '📷',
    Personal: '👤',
    Other: '✨',
  };
  albumIcon = (a: Album): string => this.albumIcons[a] ?? '✨';

  // ------- tabs overflow state -------
  @ViewChild('tabWrap') tabWrap?: ElementRef<HTMLDivElement>;
  @ViewChild(LightboxComponent) lb!: LightboxComponent;
  canScrollLeft = signal(false);
  canScrollRight = signal(false);
  private resizeSub?: Subscription;
  private galleryChangedSub?: Subscription;

  constructor() {
    effect(
      () => {
        void this.fetch();
      },
      { allowSignalWrites: true }
    );

    // Re-fetch when admin mutates gallery items in the same SPA session.
    // skip(1) avoids a double-fetch on component init.
    this.galleryChangedSub = this.api.changed$
      .pipe(skip(1))
      .subscribe(() => void this.fetch());
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    setTimeout(() => this.updateTabsOverflow(), 0);
    this.resizeSub = fromEvent(window, 'resize')
      .pipe(throttleTime(100))
      .subscribe(() => this.updateTabsOverflow());
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
    this.galleryChangedSub?.unsubscribe();
  }

  // ------- data load -------
  private async fetch() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.list({
          placement: 'gallery',
          album: (this.album() || undefined) as Album | undefined,
          published: true,
          page: this.page(),
          limit: this.limit(),
          sort: '-createdAt',
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

  // ------- tabs / overflow helpers -------
  private updateTabsOverflow() {
    if (!this.isBrowser) return;
    const el = this.tabWrap?.nativeElement;
    if (!el) return;
    const left = el.scrollLeft > 0;
    const right = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;
    this.canScrollLeft.set(left);
    this.canScrollRight.set(right);
  }
  onTabsScroll() {
    this.updateTabsOverflow();
  }
  scrollTabs(direction: 'left' | 'right') {
    if (!this.isBrowser) return;
    const el = this.tabWrap?.nativeElement;
    if (!el) return;
    const delta =
      Math.round(el.clientWidth * 0.8) * (direction === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  // ------- filters / paging -------
  setAlbum(a: Album | '') {
    this.album.set(a);
    this.page.set(1);
    if (!this.isBrowser) return;
    setTimeout(() => {
      const wrap = this.tabWrap?.nativeElement;
      if (!wrap) return;
      const active = wrap.querySelector<HTMLButtonElement>('.tab.is-active');
      active?.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
      this.updateTabsOverflow();
    }, 0);
  }
  goto(p: number) {
    if (p >= 1 && p <= this.pages()) this.page.set(p);
  }
  trackById = (_: number, it: GalleryItem) => it._id!;

  /** Hide broken images gracefully instead of showing the browser's broken-icon */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }
  joinTags(tags?: string[] | null): string {
    return Array.isArray(tags) && tags.length ? tags.join(', ') : '';
  }

  // ------- LIGHTBOX -------
  openLightbox(index: number) {
    this.lb.open(this.items(), index);
  }
}
