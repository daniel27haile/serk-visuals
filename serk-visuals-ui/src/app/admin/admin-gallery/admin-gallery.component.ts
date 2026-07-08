import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../shared/services/gallery.service';
import { UploadService, UploadResult } from '../../shared/services/upload.service';
import {
  Album,
  AlbumSummary,
  GalleryItem,
  Placement,
} from '../../shared/models/gallery.model';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';

export interface AdminFolder {
  id: string;
  label: string;
  icon: string;
  placement: Placement;
  album?: Album;
  description: string;
}

const ADMIN_FOLDERS: AdminFolder[] = [
  { id: 'slider',   label: 'Hero Slides',      icon: '🖼️',  placement: 'slider',   description: 'Homepage hero slider images' },
  { id: 'featured', label: 'Featured Gallery', icon: '⭐',  placement: 'featured', description: 'Homepage featured section' },
  { id: 'wedding',  label: 'Wedding',          icon: '💍',  placement: 'gallery',  album: 'Wedding',  description: 'Wedding photography' },
  { id: 'event',    label: 'Event',            icon: '🎪',  placement: 'gallery',  album: 'Event',    description: 'Events & celebrations' },
  { id: 'birthday', label: 'Birthday',         icon: '🎂',  placement: 'gallery',  album: 'Birthday', description: 'Birthday sessions' },
  { id: 'product',  label: 'Product',          icon: '📷',  placement: 'gallery',  album: 'Product',  description: 'Product & commercial' },
  { id: 'personal', label: 'Personal',         icon: '👤',  placement: 'gallery',  album: 'Personal', description: 'Portraits & personal' },
  { id: 'other',    label: 'Other',            icon: '✨',  placement: 'gallery',  album: 'Other',    description: 'Specialty & mixed' },
];

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-gallery.component.html',
  styleUrls: ['./admin-gallery.component.scss'],
})
export class AdminGalleryComponent implements OnInit {
  private api = inject(GalleryService);
  private uploadService = inject(UploadService);
  private fb = inject(FormBuilder);

  readonly folders = ADMIN_FOLDERS;
  readonly albums: Album[] = ['Wedding', 'Event', 'Birthday', 'Product', 'Personal', 'Other'];

  // ── View state ────────────────────────────────────────────
  view = signal<'folders' | 'images'>('folders');
  selectedFolder = signal<AdminFolder | null>(null);

  // ── Folder stats ──────────────────────────────────────────
  allStats = signal<AlbumSummary[]>([]);
  statsLoading = signal(true);
  statsError = signal<string | null>(null);

  // ── Images within a folder ────────────────────────────────
  readonly limit = 20;
  page = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<GalleryItem[]>([]);
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));

  // ── Form state ────────────────────────────────────────────
  showForm = signal(false);
  uploading = signal(false);
  editingId = signal<string | null>(null);

  form = this.fb.group({
    title:     ['', [Validators.required, Validators.minLength(2)]],
    album:     ['Wedding' as Album, Validators.required],
    tags:      [''],
    published: [true],
    image:     [null as File | null],
    thumb:     [null as File | null],
    placement: ['gallery' as Placement, Validators.required],
    order:     [0, [Validators.min(0)]],
  });

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    void this.loadStats();
  }

  // ── Folder helpers ────────────────────────────────────────
  async loadStats(): Promise<void> {
    this.statsLoading.set(true);
    this.statsError.set(null);
    try {
      const res = await firstValueFrom(this.api.getAlbums());
      this.allStats.set(res.albums);
    } catch {
      this.statsError.set('Could not load folder stats.');
    } finally {
      this.statsLoading.set(false);
    }
  }

  folderCount(folder: AdminFolder): number {
    const stats = this.allStats();
    if (folder.album) {
      return stats.find(s => s.placement === folder.placement && s.album === folder.album)?.count ?? 0;
    }
    return stats.filter(s => s.placement === folder.placement).reduce((n, s) => n + s.count, 0);
  }

  folderCover(folder: AdminFolder): string | null {
    const stats = this.allStats();
    if (folder.album) {
      const s = stats.find(s => s.placement === folder.placement && s.album === folder.album);
      return s?.coverThumbUrl ?? s?.coverUrl ?? null;
    }
    for (const s of stats.filter(s => s.placement === folder.placement)) {
      if (s.coverThumbUrl || s.coverUrl) return s.coverThumbUrl ?? s.coverUrl ?? null;
    }
    return null;
  }

  // ── Navigation ────────────────────────────────────────────
  openFolder(folder: AdminFolder): void {
    this.selectedFolder.set(folder);
    this.view.set('images');
    this.page.set(1);
    this.showForm.set(false);
    this.cancelEdit();
    this.form.patchValue({
      placement: folder.placement,
      album: folder.album ?? 'Wedding',
    });
    void this.fetchImages();
  }

  backToFolders(): void {
    this.view.set('folders');
    this.selectedFolder.set(null);
    this.items.set([]);
    this.showForm.set(false);
    this.cancelEdit();
    void this.loadStats();
  }

  // ── Image loading ─────────────────────────────────────────
  async fetchImages(): Promise<void> {
    const folder = this.selectedFolder();
    if (!folder) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.list({
          placement: folder.placement,
          album: folder.album as Album | undefined,
          page: this.page(),
          limit: this.limit,
          sort: 'order,createdAt',
        })
      );
      this.items.set(res.items ?? []);
      this.total.set(res.total ?? 0);
    } catch (e: any) {
      console.error('[AdminGallery]', e);
      this.error.set(e?.error?.message || 'Failed to load images.');
    } finally {
      this.loading.set(false);
    }
  }

  goto(p: number): void {
    if (p < 1 || p > this.pages()) return;
    this.page.set(p);
    void this.fetchImages();
  }

  // ── Form helpers ──────────────────────────────────────────
  onFile(control: 'image' | 'thumb', ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0] || null;
    this.form.patchValue({ [control]: file });
  }

  toggleForm(): void {
    if (this.showForm() && this.editingId()) {
      this.cancelEdit();
    }
    this.showForm.set(!this.showForm());
  }

  // ── Submit ────────────────────────────────────────────────
  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue() as {
      title: string; album: Album; tags: string;
      published: boolean; image: File | null; thumb: File | null;
      placement: Placement; order: number;
    };

    const id = this.editingId();
    if (!id && !v.image) {
      this.error.set('An image file is required to create a new item.');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);
    try {
      let imageUpload: UploadResult | undefined;
      let thumbUpload: UploadResult | undefined;

      if (v.image) {
        imageUpload = await this.uploadService.upload(v.image, 'uploads/gallery');
      }
      const thumbFile = v.thumb ?? (v.image ? await this.generateThumbnail(v.image) : null);
      if (thumbFile) {
        thumbUpload = await this.uploadService.upload(thumbFile, 'uploads/gallery');
      }

      const tags = v.tags ? v.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
      const payload = {
        title: v.title,
        album: v.album,
        tags,
        published: !!v.published,
        placement: v.placement,
        order: Number(v.order ?? 0),
        imageKey: imageUpload?.key,
        thumbKey: thumbUpload?.key,
      };

      if (id) {
        await firstValueFrom(this.api.update(id, payload));
      } else {
        await firstValueFrom(this.api.create({ ...payload, imageKey: imageUpload!.key }));
      }

      this.cancelEdit();
      this.showForm.set(false);
      await this.fetchImages();
      await this.loadStats();
    } catch (e: any) {
      console.error('[AdminGallery] save failed:', e);
      this.error.set(e?.error?.message || e?.message || 'Failed to save.');
    } finally {
      this.uploading.set(false);
    }
  }

  edit(item: GalleryItem): void {
    this.editingId.set(item._id!);
    this.form.reset({
      title:     item.title,
      album:     item.album,
      tags:      (item.tags || []).join(', '),
      published: !!item.published,
      image:     null,
      thumb:     null,
      placement: item.placement ?? 'gallery',
      order:     item.order ?? 0,
    });
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    const folder = this.selectedFolder();
    this.form.reset({
      title: '', album: folder?.album ?? 'Wedding',
      tags: '', published: true, image: null, thumb: null,
      placement: folder?.placement ?? 'gallery', order: 0,
    });
    ['f-image', 'f-thumb'].forEach(elId => {
      const el = document.getElementById(elId) as HTMLInputElement | null;
      if (el) el.value = '';
    });
  }

  async remove(item: GalleryItem): Promise<void> {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await firstValueFrom(this.api.remove(item._id!));
      await this.fetchImages();
      await this.loadStats();
    } catch (e) {
      console.error(e);
      alert('Failed to delete item.');
    }
  }

  async setCover(item: GalleryItem): Promise<void> {
    try {
      await firstValueFrom(this.api.setCover(item._id!));
      await this.fetchImages();
    } catch (e) {
      console.error(e);
      alert('Failed to set cover image.');
    }
  }

  async moveUp(item: GalleryItem): Promise<void> {
    const list = this.items();
    const idx = list.findIndex(i => i._id === item._id);
    if (idx <= 0) return;
    const above = list[idx - 1];
    try {
      await firstValueFrom(this.api.reorder([
        { id: item._id!,  order: above.order ?? (idx - 1) },
        { id: above._id!, order: item.order  ?? idx },
      ]));
      await this.fetchImages();
    } catch (e) { console.error(e); }
  }

  async moveDown(item: GalleryItem): Promise<void> {
    const list = this.items();
    const idx = list.findIndex(i => i._id === item._id);
    if (idx >= list.length - 1) return;
    const below = list[idx + 1];
    try {
      await firstValueFrom(this.api.reorder([
        { id: item._id!,  order: below.order ?? (idx + 1) },
        { id: below._id!, order: item.order  ?? idx },
      ]));
      await this.fetchImages();
    } catch (e) { console.error(e); }
  }

  private generateThumbnail(file: File, maxWidth = 800, quality = 0.75): Promise<File | null> {
    return new Promise(resolve => {
      if (!file.type.startsWith('image/')) { resolve(null); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (!blob) { resolve(null); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '_thumb.webp', { type: 'image/webp' }));
        }, 'image/webp', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  onImgError(event: Event, item: GalleryItem): void {
    console.warn('[AdminGallery] Image failed to load:', item.url);
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }

  trackById = (_: number, it: GalleryItem) => it._id!;
}
