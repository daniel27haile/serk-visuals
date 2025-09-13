import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookingsService } from '../../shared/services/booking.service';
import { Booking, BookingType } from '../../shared/models/booking.model';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { RouterLink } from '@angular/router';

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

  // Machine values (lowercase) + human labels
  readonly types: { value: BookingType; label: string }[] = [
    { value: 'Wedding', label: 'Wedding' },
    { value: 'Event', label: 'Event' },
    { value: 'Birthday', label: 'Birthday' },
    { value: 'Product', label: 'Product' },
    { value: 'Personal', label: 'Personal' },
    { value: 'Other', label: 'Other' },
  ];
  readonly durations = [30, 60, 90, 120, 180];

  submitting = signal(false);
  submitted = signal(false);
  err = signal<string | null>(null);
  slotAvailable = signal<boolean | null>(null);

  // Holds data to show on the success screen
  success = signal<{ when: string; duration: number; email?: string } | null>(
    null
  );

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
  }

  /** Build ISO (UTC) from local date (yyyy-MM-dd) + time (HH:mm). */
  private toLocalISO(dateStr: string, timeStr?: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    let hh = 0,
      mm = 0;
    if (timeStr) {
      const [H, M] = timeStr.split(':').map(Number);
      hh = H ?? 0;
      mm = M ?? 0;
    }
    const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0); // local
    return dt.toISOString(); // server stores UTC
  }

  /** Friendly local datetime string for success panel */
  private toLocalReadable(iso: string): string {
    const dt = new Date(iso);
    // e.g. "Fri, Sep 12, 2025, 10:30 AM"
    return dt.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      type: v.type, // BookingType
      date: iso, // ISO combined
      durationMinutes: v.durationMinutes,
      message: v.message || undefined,
    };

    this.api.create(payload).subscribe({
      next: (created: Booking) => {
        this.submitting.set(false);

        // Prepare success info and switch to thank-you view
        this.success.set({
          when: created.date
            ? this.toLocalReadable(created.date)
            : this.toLocalReadable(iso),
          duration: created.durationMinutes ?? v.durationMinutes,
          email: v.email,
        });
        this.submitted.set(true);

        // Optional: clear the form in the background
        this.form.reset({
          name: '',
          email: '',
          phone: '',
          type: this.defaultType,
          date: '',
          time: '',
          durationMinutes: 60,
          message: '',
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
}
