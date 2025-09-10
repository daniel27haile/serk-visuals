import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookingsService } from '../../shared/services/booking.service';
import { BookingType } from '../../shared/models/booking.model';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(BookingsService);

  readonly types: BookingType[] = [
    'wedding',
    'event',
    'birthday',
    'product',
    'personal',
    'other',
  ];

  submitting = signal(false);
  submitted = signal(false);
  err = signal<string | null>(null);

  form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    phone: this.fb.control(''),
    type: this.fb.control<BookingType>('event'),
    date: this.fb.control('', [Validators.required]),
    time: this.fb.control('', [Validators.required]),
    message: this.fb.control(''),
  });

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
    const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0); // local time
    return dt.toISOString(); // store UTC on server
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.err.set(null);

    const v = this.form.getRawValue(); // fully typed, non-nullable
    const iso = this.toLocalISO(v.date, v.time);

    const phoneTrimmed = v.phone.trim();
    const payload = {
      name: v.name,
      email: v.email,
      phone: phoneTrimmed ? Number(phoneTrimmed) : undefined,
      type: v.type,
      date: iso, // combined ISO datetime
      // time: v.time,          // send if you also want raw time
      message: v.message || undefined,
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.form.reset({
          name: '',
          email: '',
          phone: '',
          type: 'event',
          date: '',
          time: '',
          message: '',
        });
      },
      error: (e) => {
        this.submitting.set(false);
        this.err.set(e?.error?.message || 'Failed to submit booking.');
      },
    });
  }
}
