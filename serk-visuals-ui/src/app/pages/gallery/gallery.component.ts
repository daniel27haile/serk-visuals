import {
  Component,
  computed,
  inject,
  signal,
  ViewChild,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GalleryService } from '../../shared/services/gallery.service';
import { Album, AlbumSummary, GalleryItem } from '../../shared/models/gallery.model';
import { firstValueFrom, Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { LightboxComponent } from '../../shared/components/lightbox/lightbox.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, LightboxComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryPage implements OnInit, OnDestroy {
  private api = inject(GalleryService);
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly albums: Album[] = ['Real Estate'];

  // ── View state ────────────────────────────────────────────
  view = signal<'albums' | 'images'>('albums');
  selectedAlbum = signal<Album | ''>('');

  // ── Album summary data ────────────────────────────────────
  albumStats = signal<AlbumSummary[]>([]);
  albumsLoading = signal(true);
  albumsError = signal<string | null>(null);
  totalAllImages = signal(0);

  // ── Image grid data ───────────────────────────────────────
  readonly limit = 12;
  page = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<GalleryItem[]>([]);
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));

  @ViewChild(LightboxComponent) lb!: LightboxComponent;
  private changeSub?: Subscription;

  private readonly albumIcons: Record<Album, string> = {
    'Real Estate': '🏡', Wedding: '💍', Event: '🎪', Birthday: '🎂',
    Product: '📷', Personal: '👤', Other: '✨',
  };

  private readonly albumDescs: Record<Album, string> = {
    'Real Estate': 'Property & listing photography',
    Wedding: 'Weddings & engagements',
    Event: 'Corporate & social events',
    Birthday: 'Birthday sessions',
    Product: 'Product & commercial',
    Personal: 'Portraits & personal',
    Other: 'Specialty & mixed',
  };

  albumIcon = (a: Album): string => this.albumIcons[a] ?? '✨';
  albumDesc = (a: Album): string => this.albumDescs[a] ?? '';

  statsFor(album: Album): AlbumSummary | undefined {
    return this.albumStats().find(s => s.album === album && s.placement === 'gallery');
  }

  get selectedAlbumLabel(): string {
    const a = this.selectedAlbum();
    return a || 'All Photos';
  }

  get selectedAlbumIcon(): string {
    const a = this.selectedAlbum();
    return a ? this.albumIcon(a as Album) : '⭐';
  }

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    void this.loadAlbums();
    this.changeSub = this.api.changed$.pipe(skip(1)).subscribe(() => {
      if (this.view() === 'albums') void this.loadAlbums();
      else void this.fetchImages();
    });
  }

  ngOnDestroy(): void {
    this.changeSub?.unsubscribe();
  }

  // ── Data loading ──────────────────────────────────────────
  async loadAlbums(): Promise<void> {
    this.albumsLoading.set(true);
    this.albumsError.set(null);
    try {
      const res = await firstValueFrom(this.api.getAlbums({ placement: 'gallery' }));
      this.albumStats.set(res.albums);
      this.totalAllImages.set(res.albums.reduce((n, s) => n + s.publishedCount, 0));
      // Default to Real Estate album when it has published images
      const hasRealEstate = res.albums.some(s => s.album === 'Real Estate' && s.publishedCount > 0);
      if (hasRealEstate) {
        this.openAlbum('Real Estate');
      }
    } catch (e: any) {
      const status = e?.status ?? 'network';
      const msg = e?.error?.message || e?.message || 'Could not load albums.';
      console.error(`[Gallery] loadAlbums failed (${status}):`, msg, e);
      this.albumsError.set('Could not load albums. Please try again later.');
    } finally {
      this.albumsLoading.set(false);
    }
  }

  async fetchImages(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const album = this.selectedAlbum();
      const res = await firstValueFrom(
        this.api.list({
          placement: 'gallery',
          album: (album || undefined) as Album | undefined,
          published: true,
          page: this.page(),
          limit: this.limit,
          sort: 'order,-createdAt',
        })
      );
      this.items.set(res.items ?? []);
      this.total.set(res.total ?? 0);
    } catch (e: any) {
      const status = e?.status ?? 'network';
      const msg = e?.error?.message || e?.message || 'Failed to load images.';
      console.error(`[Gallery] fetchImages failed (${status}):`, msg, e);
      this.error.set('Failed to load images. Please try again later.');
      this.items.set([]);
      this.total.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Navigation ────────────────────────────────────────────
  openAlbum(album: Album | ''): void {
    this.selectedAlbum.set(album);
    this.page.set(1);
    this.view.set('images');
    void this.fetchImages();
  }

  backToAlbums(): void {
    this.view.set('albums');
    this.items.set([]);
    this.error.set(null);
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goto(p: number): void {
    if (p < 1 || p > this.pages()) return;
    this.page.set(p);
    void this.fetchImages();
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Helpers ───────────────────────────────────────────────
  openLightbox(index: number): void {
    this.lb.open(this.items(), index);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }

  trackById = (_: number, it: GalleryItem) => it._id!;
}
