import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookingsService } from "../../shared/services/booking.service";
import { BookingType } from "../../shared/models/booking.model";

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./booking.component.html",
  styleUrls: ['./booking.component.scss'],
})
export class BookingFormPage {
  private fb = inject(FormBuilder);
  private api = inject(BookingsService);

  // enums aligned with backend
  readonly types: BookingType[] = [
    'wedding',
    'event',
    'portrait',
    'product',
    'video',
  ];

  submitting = signal(false);
  submitted = signal(false);
  err = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''], // string in UI; convert to number before send
    type: ['event' as BookingType],
    date: [''], // yyyy-MM-dd from <input type="date">
    message: [''],
    // status not needed: backend defaults to "new"
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.err.set(null);

    // Normalize fields expected by backend
    const v = this.form.value;
    const payload = {
      name: v.name!,
      email: v.email!,
      phone: v.phone ? Number(v.phone) : undefined, // backend expects Number
      type: v.type ?? undefined,
      date: v.date ? new Date(v.date).toISOString() : undefined,
      message: v.message ?? undefined,
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.form.reset({ type: 'event' }); // reset to defaults
      },
      error: (e) => {
        this.submitting.set(false);
        this.err.set(e?.error?.message || 'Failed to submit booking.');
      },
    });
  }
}
