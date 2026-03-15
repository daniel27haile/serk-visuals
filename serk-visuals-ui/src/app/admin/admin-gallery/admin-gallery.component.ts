// src/app/admin/admin-gallery/admin-gallery.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../shared/services/gallery.service';
import { UploadService } from '../../shared/services/upload.service';
import {
  Album,
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

  albums: Album[] = [
    'Wedding',
    'Event',
    'Birthday',
    'Product',
    'Personal',
    'Other',
  ];
  placements: Placement[] = ['gallery', 'slider', 'featured'];

  album = signal<Album | ''>('');
  page = signal(1);
  limit = signal(20);
  loading = signal(true);
  uploading = signal(false);
  error = signal<string | null>(null);

  items = signal<GalleryItem[]>([]);
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    album: ['Wedding' as Album, Validators.required],
    tags: [''],
    published: [true],
    image: [null as File | null],
    thumb: [null as File | null],
    placement: ['gallery' as Placement, Validators.required],
    order: [0, [Validators.min(0)]],
  });

  editingId = signal<string | null>(null);

  ngOnInit(): void {
    this.fetch();
  }

  async fetch() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.list({
          album: (this.album() || undefined) as Album | undefined,
          page: this.page(),
          limit: this.limit(),
        })
      );
      this.items.set(res.items);
      this.total.set(res.total);
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.error?.message || 'Failed to load gallery items.');
      this.items.set([]);
      this.total.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  setAlbum(a: Album | '') {
    this.album.set(a);
    this.page.set(1);
    this.fetch();
  }

  goto(p: number) {
    if (p < 1 || p > this.pages()) return;
    this.page.set(p);
    this.fetch();
  }

  onFile(control: 'image' | 'thumb', ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.form.patchValue({ [control]: file });
  }

  async submit() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue() as {
      title: string;
      album: Album;
      tags: string;
      published: boolean;
      image: File | null;
      thumb: File | null;
      placement: Placement;
      order: number;
    };

    const tags = v.tags
      ? v.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const id = this.editingId();

    // Require image for new items
    if (!id && !v.image) {
      alert('Image is required');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);

    try {
      // Upload files to S3 first
      let imageKey: string | undefined;
      let thumbKey: string | undefined;

      if (v.image) {
        imageKey = await this.uploadService.upload(v.image, 'uploads/gallery');
      }
      if (v.thumb) {
        thumbKey = await this.uploadService.upload(v.thumb, 'uploads/gallery');
      }

      if (id) {
        await firstValueFrom(
          this.api.update(id, {
            title: v.title,
            album: v.album,
            tags,
            published: !!v.published,
            imageKey,
            thumbKey,
            placement: v.placement,
            order: Number(v.order ?? 0),
          })
        );
      } else {
        await firstValueFrom(
          this.api.create({
            title: v.title,
            album: v.album,
            tags,
            published: !!v.published,
            imageKey: imageKey!,
            thumbKey,
            placement: v.placement,
            order: Number(v.order ?? 0),
          })
        );
      }

      this.cancelEdit();
      await this.fetch();
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.error?.message || e?.message || 'Failed to save.');
    } finally {
      this.uploading.set(false);
    }
  }

  edit(item: GalleryItem) {
    this.editingId.set(item._id!);
    this.form.reset({
      title: item.title,
      album: item.album,
      tags: (item.tags || []).join(', '),
      published: !!item.published,
      image: null,
      thumb: null,
      placement: item.placement ?? 'gallery',
      order: item.order ?? 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      album: 'Wedding',
      tags: '',
      published: true,
      image: null,
      thumb: null,
      placement: 'gallery',
      order: 0,
    });
    const imgEl = document.getElementById('image') as HTMLInputElement | null;
    if (imgEl) imgEl.value = '';
    const thumbEl = document.getElementById('thumb') as HTMLInputElement | null;
    if (thumbEl) thumbEl.value = '';
  }

  async remove(item: GalleryItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await firstValueFrom(this.api.remove(item._id!));
      await this.fetch();
    } catch (e) {
      console.error(e);
      alert('Failed to delete.');
    }
  }

  trackById = (_: number, it: GalleryItem) => it._id!;
}
