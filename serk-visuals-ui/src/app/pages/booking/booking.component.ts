import { Component, inject, signal, computed } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, firstValueFrom } from 'rxjs';

import { BookingsService } from '../../shared/services/booking.service';
import { Booking, BookingType } from '../../shared/models/booking.model';

// ⭐ bring in gallery for sample images
import { GalleryService } from '../../shared/services/gallery.service';
import { GalleryItem } from '../../shared/models/gallery.model';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(BookingsService);
  private readonly galleryApi = inject(GalleryService);

  // Machine values (lowercase) + human labels
  readonly types: { value: BookingType; label: string }[] = [
    { value: 'Wedding',  label: 'Wedding'  },
    { value: 'Event',    label: 'Event'    },
    { value: 'Birthday', label: 'Birthday' },
    { value: 'Product',  label: 'Product'  },
    { value: 'Personal', label: 'Personal' },
    { value: 'Other',    label: 'Other'    },
  ];
  readonly durations = [30, 60, 90, 120, 180];

  submitting = signal(false);
  submitted  = signal(false);
  err        = signal<string | null>(null);
  slotAvailable = signal<boolean | null>(null);

  // Holds data to show on the success screen
  success = signal<{ when: string; duration: number; email?: string } | null>(null);

  private readonly defaultType: BookingType = 'Event';

  form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    phone: this.fb.control(''),
    type: this.fb.control<BookingType>(this.defaultType),
    date: this.fb.control('', [Validators.required]), // yyyy-MM-dd
    time: this.fb.control('', [Validators.required]), // HH:mm
    durationMinutes: this.fb.control(60),
    message: this.fb.control(''),
  });

  // ======= Sample images (Featured gallery) =======
  featured = signal<GalleryItem[]>([]);
  loadingFeatured = signal(true);
  errorFeatured   = signal<string | null>(null);

  // ======= Lightbox state =======
  lightboxOpen = signal(false);
  lightboxIdx  = signal(0);
  lightboxList = signal<GalleryItem[]>([]);
  lbCurr = computed<GalleryItem | null>(() => {
    const arr = this.lightboxList();
    const i = this.lightboxIdx();
    return i >= 0 && i < arr.length ? arr[i] : null;
  });
  private _prevOverflow: string | undefined;

  constructor() {
    // Live availability check when date/time/duration changes
    this.form.valueChanges
      .pipe(
        debounceTime(250),
        map((v) => ({
          date: v.date,
          time: v.time,
          durationMinutes: v.durationMinutes,
        })),
        distinctUntilChanged(
          (a, b) =>
            a.date === b.date &&
            a.time === b.time &&
            a.durationMinutes === b.durationMinutes
        ),
        filter((v) => !!v.date && !!v.time && !!v.durationMinutes)
      )
      .subscribe((v) => {
        const iso = this.toLocalISO(v.date!, v.time!);
        this.api
          .checkAvailability({ date: iso, durationMinutes: v.durationMinutes! })
          .subscribe({
            next: (r) => this.slotAvailable.set(r.available),
            error: () => this.slotAvailable.set(null),
          });
      });

    // Load a few featured images for the lightbox demo
    this.loadFeatured();
  }

  // ---------- FEATURED LOADER ----------
  private async loadFeatured() {
    this.loadingFeatured.set(true);
    this.errorFeatured.set(null);
    try {
      const res = await firstValueFrom(
        this.galleryApi.list({
          placement: 'featured',
          published: true,
          limit: 9,
          sort: 'order,-createdAt',
        })
      );
      this.featured.set(res.items ?? []);
    } catch (e: any) {
      this.errorFeatured.set(e?.error?.message || 'Failed to load images.');
      this.featured.set([]);
    } finally {
      this.loadingFeatured.set(false);
    }
  }

  // ---------- UTILS ----------
  /** Build ISO (UTC) from local date (yyyy-MM-dd) + time (HH:mm). */
  private toLocalISO(dateStr: string, timeStr?: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    let hh = 0, mm = 0;
    if (timeStr) {
      const [H, M] = timeStr.split(':').map(Number);
      hh = H ?? 0; mm = M ?? 0;
    }
    const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
    return dt.toISOString();
  }

  /** Friendly local datetime string for success panel */
  private toLocalReadable(iso: string): string {
    const dt = new Date(iso);
    return dt.toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    if (this.slotAvailable() === false) {
      this.err.set('This time slot is already booked. Please choose another.');
      return;
    }

    this.submitting.set(true);
    this.err.set(null);

    const v = this.form.getRawValue();
    const iso = this.toLocalISO(v.date, v.time);
    const phoneTrimmed = v.phone.trim();

    const payload = {
      name: v.name,
      email: v.email,
      phone: phoneTrimmed ? Number(phoneTrimmed) : undefined,
      type: v.type,
      date: iso,
      durationMinutes: v.durationMinutes,
      message: v.message || undefined,
    };

    this.api.create(payload).subscribe({
      next: (created: Booking) => {
        this.submitting.set(false);
        this.success.set({
          when: created.date ? this.toLocalReadable(created.date) : this.toLocalReadable(iso),
          duration: created.durationMinutes ?? v.durationMinutes,
          email: v.email,
        });
        this.submitted.set(true);

        this.form.reset({
          name: '', email: '', phone: '', type: this.defaultType,
          date: '', time: '', durationMinutes: 60, message: '',
        });
        this.slotAvailable.set(null);
      },
      error: (e) => {
        this.submitting.set(false);
        this.err.set(
          e?.status === 409
            ? 'This time slot is already booked. Please choose another.'
            : e?.error?.message || 'Failed to submit booking.'
        );
      },
    });
  }

  // ---------- Lightbox ----------
  openLightbox(list: GalleryItem[], startIndex: number) {
    if (!list || list.length === 0) return;
    const idx = Math.min(Math.max(0, startIndex), list.length - 1);
    this.lightboxList.set(list);
    this.lightboxIdx.set(idx);
    this.lightboxOpen.set(true);
    this.lockScroll(true);
    // focus trap entry
    setTimeout(() => document.getElementById('lb-root')?.focus(), 0);
  }
  closeLightbox() {
    this.lightboxOpen.set(false);
    this.lockScroll(false);
  }
  lbNext() {
    const len = this.lightboxList().length || 1;
    this.lightboxIdx.update((i) => (i + 1) % len);
  }
  lbPrev() {
    const len = this.lightboxList().length || 1;
    this.lightboxIdx.update((i) => (i - 1 + len) % len);
  }
  onLightboxKey(e: KeyboardEvent) {
    if (!this.lightboxOpen()) return;
    if (e.key === 'Escape') this.closeLightbox();
    if (e.key === 'ArrowRight') this.lbNext();
    if (e.key === 'ArrowLeft') this.lbPrev();
  }
  private lockScroll(on: boolean) {
    const root = document.documentElement;
    if (on) {
      this._prevOverflow = root.style.overflow;
      root.style.overflow = 'hidden';
    } else {
      root.style.overflow = this._prevOverflow ?? '';
    }
  }

  // trackBy for images
  trackByGallery = (_: number, it: GalleryItem) => it._id!;
}
