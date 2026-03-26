import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';

import { BookingsService } from '../../shared/services/booking.service';
import { Booking, BookingType } from '../../shared/models/booking.model';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingFormPage {
  private readonly fb  = inject(NonNullableFormBuilder);
  private readonly api = inject(BookingsService);

  readonly types: { value: BookingType; label: string }[] = [
    { value: 'Wedding',  label: 'Wedding'  },
    { value: 'Event',    label: 'Event'    },
    { value: 'Birthday', label: 'Birthday' },
    { value: 'Product',  label: 'Product'  },
    { value: 'Personal', label: 'Personal' },
    { value: 'Other',    label: 'Other'    },
  ];
  readonly minDurationMinutes  = 60;
  readonly maxDurationMinutes  = 480;
  readonly durationStepMinutes = 60;

  get durationLabel(): string {
    const hours = (this.form.controls.durationMinutes.value ?? 60) / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  decrementDuration(): void {
    const next = Math.max(
      this.minDurationMinutes,
      this.form.controls.durationMinutes.value - this.durationStepMinutes,
    );
    this.form.controls.durationMinutes.setValue(next);
  }

  incrementDuration(): void {
    const next = Math.min(
      this.maxDurationMinutes,
      this.form.controls.durationMinutes.value + this.durationStepMinutes,
    );
    this.form.controls.durationMinutes.setValue(next);
  }

  submitting    = signal(false);
  submitted     = signal(false);
  err           = signal<string | null>(null);
  slotAvailable = signal<boolean | null>(null);
  checkingSlot  = signal(false);

  success = signal<{ when: string; duration: number; email?: string } | null>(null);

  private readonly defaultType: BookingType = 'Event';

  form = this.fb.group({
    name:            this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email:           this.fb.control('', [Validators.required, Validators.email]),
    phone:           this.fb.control(''),
    type:            this.fb.control<BookingType>(this.defaultType),
    date:            this.fb.control('', [Validators.required]),
    time:            this.fb.control('', [Validators.required]),
    durationMinutes: this.fb.control(60),
    message:         this.fb.control(''),
  });

  constructor() {
    // Live availability check whenever date / time / duration changes
    this.form.valueChanges
      .pipe(
        debounceTime(400),
        map((v) => ({
          date:            v.date,
          time:            v.time,
          durationMinutes: v.durationMinutes,
        })),
        distinctUntilChanged(
          (a, b) =>
            a.date === b.date &&
            a.time === b.time &&
            a.durationMinutes === b.durationMinutes,
        ),
        filter((v) => !!v.date && !!v.time && !!v.durationMinutes),
      )
      .subscribe((v) => {
        this.slotAvailable.set(null);
        this.checkingSlot.set(true);
        const iso = this.toLocalISO(v.date!, v.time!);
        this.api
          .checkAvailability({ date: iso, durationMinutes: v.durationMinutes! })
          .subscribe({
            next: (r) => {
              this.checkingSlot.set(false);
              this.slotAvailable.set(r.available);
            },
            error: () => {
              this.checkingSlot.set(false);
              this.slotAvailable.set(null);
            },
          });
      });
  }

  // ---------- UTILS ----------
  private toLocalISO(dateStr: string, timeStr?: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    let hh = 0, mm = 0;
    if (timeStr) {
      const [H, M] = timeStr.split(':').map(Number);
      hh = H ?? 0; mm = M ?? 0;
    }
    return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0).toISOString();
  }

  private toLocalReadable(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
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
      name:            v.name,
      email:           v.email,
      phone:           phoneTrimmed ? Number(phoneTrimmed) : undefined,
      type:            v.type,
      date:            iso,
      durationMinutes: v.durationMinutes,
      message:         v.message || undefined,
    };

    this.api.create(payload).subscribe({
      next: (created: Booking) => {
        this.submitting.set(false);
        this.success.set({
          when:     created.date ? this.toLocalReadable(created.date) : this.toLocalReadable(iso),
          duration: created.durationMinutes ?? v.durationMinutes,
          email:    v.email,
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
            : e?.status === 0
              ? 'Unable to connect to the server. Please check your connection and try again.'
              : e?.error?.message || 'Failed to submit booking. Please try again.',
        );
      },
    });
  }
}
