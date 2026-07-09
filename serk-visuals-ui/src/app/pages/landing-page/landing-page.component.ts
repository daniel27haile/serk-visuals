import {
  Component,
  OnDestroy,
  signal,
  inject,
  effect,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LightboxComponent } from '../../shared/components/lightbox/lightbox.component';
import { firstValueFrom, Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';

import { GalleryService } from '../../shared/services/gallery.service';
import { TestimonialService } from '../../shared/services/testimonial.service';
import { GalleryItem } from '../../shared/models/gallery.model';
import { Testimonial } from '../../shared/models/testimonial.model';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LightboxComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private galleryApi = inject(GalleryService);
  private testiApi = inject(TestimonialService);

  readonly starOptions = [1, 2, 3, 4, 5];

  // ====== DATA ======
  slider = signal<GalleryItem[]>([]);
  featured = signal<GalleryItem[]>([]);
  testimonials = signal<Testimonial[]>([]);

  loadingSlider = signal(true);
  loadingFeatured = signal(true);
  loadingTestimonials = signal(true);

  errorSlider = signal<string | null>(null);
  errorFeatured = signal<string | null>(null);
  errorTestimonials = signal<string | null>(null);

  // ===== SLIDERS STATE =====
  index = signal(0); // hero slider
  tIndex = signal(0); // testimonials
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  private testiTimer: ReturnType<typeof setInterval> | null = null;
  private testiChangedSub?: Subscription;
  private galleryChangedSub?: Subscription;

  @ViewChild(LightboxComponent) lb!: LightboxComponent;

  // ===== FEATURED CAROUSEL =====
  @ViewChild('featViewport') private featViewportEl?: ElementRef<HTMLElement>;
  @ViewChild('featTrack')    private featTrackEl?: ElementRef<HTMLElement>;

  readonly featRenderItems = signal<GalleryItem[]>([]);
  readonly featX           = signal(0);
  readonly featTransition  = signal(false);
  readonly featInfinite    = signal(false);

  private _featOriginLen    = 0;
  private _featCardPx       = 0;
  private _featGapPx        = 0;
  private _featIdx          = 0;
  private _featPaused       = false;
  private _featTimer: ReturnType<typeof setTimeout> | null = null;
  private _featResizeObs: ResizeObserver | null = null;
  private _featResizeDebounce: ReturnType<typeof setTimeout> | null = null;
  private _featTouchX0      = 0;

  constructor() {
    effect(
      () => {
        this.loadSlider();
        this.loadFeatured();
        this.loadTestimonials();

        if (isPlatformBrowser(this.platformId)) {
          this.startTimers();
        }
      },
      { allowSignalWrites: true }
    );

    // Re-fetch testimonials whenever admin performs a create/update/delete.
    // skip(1) skips the initial BehaviorSubject emission (the component loads
    // data itself on init via the effect above).
    this.testiChangedSub = this.testiApi.changed$
      .pipe(skip(1))
      .subscribe(() => this.loadTestimonials());

    // Re-fetch slider and featured whenever admin mutates gallery items.
    this.galleryChangedSub = this.galleryApi.changed$
      .pipe(skip(1))
      .subscribe(() => {
        this.loadSlider();
        this.loadFeatured();
      });

    // Initialize featured gallery carousel whenever items change.
    effect(() => {
      const items = this.featured();
      if (isPlatformBrowser(this.platformId)) {
        this.destroyFeatCarousel();
        if (items.length > 0) {
          setTimeout(() => this.initFeatCarousel(items), 0);
        }
      }
    }, { allowSignalWrites: true });
  }

  // ---------- LOADERS ----------
  private async loadSlider() {
    this.loadingSlider.set(true);
    this.errorSlider.set(null);
    try {
      const res = await firstValueFrom(
        this.galleryApi.list({
          placement: 'slider',
          published: true,
          limit: 10,
          sort: 'order,-createdAt',
        })
      );
      const items = res.items ?? [];
      this.slider.set(items);
      if (this.index() >= items.length) this.index.set(0);
    } catch (e: any) {
      console.error('[Landing] loadSlider failed:', e?.status, e?.error?.message || e?.message, e);
      this.errorSlider.set(e?.error?.message || 'Failed to load slider.');
      this.slider.set([]);
    } finally {
      this.loadingSlider.set(false);
    }
  }

  private async loadFeatured() {
    this.loadingFeatured.set(true);
    this.errorFeatured.set(null);
    try {
      const res = await firstValueFrom(
        this.galleryApi.list({
          placement: 'featured',
          published: true,
          limit: 12,
          sort: 'order,-createdAt',
        })
      );
      this.featured.set(res.items ?? []);
    } catch (e: any) {
      console.error('[Landing] loadFeatured failed:', e?.status, e?.error?.message || e?.message, e);
      this.errorFeatured.set(e?.error?.message || 'Failed to load featured.');
      this.featured.set([]);
    } finally {
      this.loadingFeatured.set(false);
    }
  }

  private async loadTestimonials() {
    this.loadingTestimonials.set(true);
    this.errorTestimonials.set(null);
    try {
      const res = await firstValueFrom(
        this.testiApi.list({
          published: true,
          limit: 10,
          sort: 'order,-createdAt',
        })
      );
      const items = res.items ?? [];
      this.testimonials.set(items);
      if (this.tIndex() >= items.length) this.tIndex.set(0);
    } catch (e: any) {
      console.error('[Landing] loadTestimonials failed:', e?.status, e?.error?.message || e?.message, e);
      this.errorTestimonials.set(
        e?.error?.message || 'Failed to load testimonials.'
      );
      this.testimonials.set([]);
    } finally {
      this.loadingTestimonials.set(false);
    }
  }

  // ---------- AUTOPLAY ----------
  startTimers() {
    this.stopTimers();
    this.heroTimer = setInterval(() => this.next(), 4500);
    this.testiTimer = setInterval(() => this.tNext(), 6000);
  }
  stopTimers() {
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.testiTimer) clearInterval(this.testiTimer);
    this.heroTimer = null;
    this.testiTimer = null;
  }
  ngOnDestroy() {
    this.stopTimers();
    this.destroyFeatCarousel();
    this.testiChangedSub?.unsubscribe();
    this.galleryChangedSub?.unsubscribe();
  }

  // ===== HERO slider controls =====
  next() {
    const len = this.slider().length || 1;
    this.index.update((i) => (i + 1) % len);
  }
  prev() {
    const len = this.slider().length || 1;
    this.index.update((i) => (i - 1 + len) % len);
  }
  go(i: number) {
    const len = this.slider().length || 1;
    this.index.set(Math.max(0, Math.min(i, len - 1)));
  }
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  // ===== TESTIMONIAL slider controls =====
  tNext() {
    const len = this.testimonials().length || 1;
    this.tIndex.update((i) => (i + 1) % len);
  }
  tPrev() {
    const len = this.testimonials().length || 1;
    this.tIndex.update((i) => (i - 1 + len) % len);
  }
  tGo(i: number) {
    const len = this.testimonials().length || 1;
    this.tIndex.set(Math.max(0, Math.min(i, len - 1)));
  }
  onKeyTestimonial(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.tNext();
    if (e.key === 'ArrowLeft') this.tPrev();
  }

  // ===== Image error fallback =====
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }

  // ===== trackBy =====
  trackByGallery = (_: number, it: GalleryItem) => it._id!;
  trackByTestimonial = (_: number, it: Testimonial) => it._id ?? it.author;

  initials(author: string): string {
    return author
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  trackByFeatItem = (i: number, it: GalleryItem) => `${i}:${it._id}`;

  // ===== FEATURED GALLERY CAROUSEL =====

  private initFeatCarousel(items: GalleryItem[]): void {
    this._featOriginLen = items.length;
    const infinite = items.length >= 3;
    this.featInfinite.set(infinite);
    if (infinite) {
      this.featRenderItems.set([...items, ...items, ...items]);
      this._featIdx = items.length; // start at middle copy
    } else {
      this.featRenderItems.set([...items]);
      this._featIdx = 0;
    }
    this.featTransition.set(false);
    // Double setTimeout: first tick lets Angular flush signal writes to DOM;
    // second tick ensures the browser has completed layout on the new elements.
    setTimeout(() => setTimeout(() => {
      this.measureFeatCard();
      this.featX.set(this.calcFeatOffset(this._featIdx));
      if (infinite) this.startFeatTimer();
      this.setupFeatResize();
    }));
  }

  private measureFeatCard(): void {
    const track = this.featTrackEl?.nativeElement;
    if (!track) return;
    const item = track.querySelector<HTMLElement>('.feat-item');
    if (!item) return;
    this._featCardPx = item.getBoundingClientRect().width;
    this._featGapPx  = parseFloat(getComputedStyle(track).columnGap) || 0;
  }

  private calcFeatOffset(idx: number): number {
    return -(idx * (this._featCardPx + this._featGapPx));
  }

  private startFeatTimer(): void {
    this.stopFeatTimer();
    this._featTimer = setTimeout(() => this.featTick(), 9000);
  }

  private stopFeatTimer(): void {
    if (this._featTimer !== null) {
      clearTimeout(this._featTimer);
      this._featTimer = null;
    }
  }

  private featTick(): void {
    if (!this._featPaused) this.advanceFeat(1);
    this.startFeatTimer();
  }

  advanceFeat(dir: 1 | -1): void {
    const total = this.featRenderItems().length;
    if (total === 0 || this.featTransition()) return;
    this._featIdx = Math.max(0, Math.min(this._featIdx + dir, total - 1));
    this.featTransition.set(true);
    this.featX.set(this.calcFeatOffset(this._featIdx));
  }

  onFeatTransitionEnd(e: TransitionEvent): void {
    if (e.propertyName !== 'transform') return;
    if (!this.featInfinite()) return;
    const o = this._featOriginLen;
    let newIdx: number | null = null;
    if (this._featIdx >= o * 2)  newIdx = this._featIdx - o;
    else if (this._featIdx < o)  newIdx = this._featIdx + o;
    if (newIdx !== null) {
      this.featTransition.set(false);
      this._featIdx = newIdx;
      this.featX.set(this.calcFeatOffset(this._featIdx));
    }
  }

  pauseFeat(): void  { this._featPaused = true; }
  resumeFeat(): void { this._featPaused = false; }

  isFeatClone(idx: number): boolean {
    if (!this.featInfinite()) return false;
    const o = this._featOriginLen;
    return idx < o || idx >= o * 2;
  }

  featItemClick(idx: number): void {
    if (this.isFeatClone(idx)) return;
    const realIdx = this.featInfinite() ? idx - this._featOriginLen : idx;
    this.lb.open(this.featured(), realIdx);
  }

  onFeatTouchStart(e: TouchEvent): void {
    this._featTouchX0 = e.touches[0].clientX;
  }

  onFeatTouchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this._featTouchX0;
    if (Math.abs(dx) > 40) this.advanceFeat(dx < 0 ? 1 : -1);
  }

  private setupFeatResize(): void {
    this._featResizeObs?.disconnect();
    const vp = this.featViewportEl?.nativeElement;
    if (!vp || typeof ResizeObserver === 'undefined') return;
    this._featResizeObs = new ResizeObserver(() => {
      if (this._featResizeDebounce) clearTimeout(this._featResizeDebounce);
      this._featResizeDebounce = setTimeout(() => {
        this.featTransition.set(false);
        this.measureFeatCard();
        this.featX.set(this.calcFeatOffset(this._featIdx));
      }, 150);
    });
    this._featResizeObs.observe(vp);
  }

  private destroyFeatCarousel(): void {
    this.stopFeatTimer();
    this._featResizeObs?.disconnect();
    this._featResizeObs = null;
    if (this._featResizeDebounce !== null) {
      clearTimeout(this._featResizeDebounce);
      this._featResizeDebounce = null;
    }
  }

}
