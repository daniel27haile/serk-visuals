import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService } from '../../shared/services/booking.service';
import { BookingType } from '../../shared/models/booking.model';

@Component({
  standalone: true,
  selector: 'app-booking-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent {
  private fb = inject(FormBuilder);
  private api = inject(BookingService);

  // enum options (matches schema)
  types: BookingType[] = ['wedding', 'event', 'portrait', 'product', 'video'];

  // ui state as signals (so template's submitting() / submitted() / err() work)
  submitting = signal(false);
  submitted = signal(false);
  err = signal<string | null>(null);

  // form controls (match schema fields)
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''], // schema is Number; we’ll convert on submit
    type: ['wedding' as BookingType, Validators.required],
    date: ['', Validators.required], // yyyy-mm-dd from <input type="date">
    message: [''],
  });

  submit() {
    this.err.set(null);
    this.submitted.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const v = this.form.value;

    // Convert phone -> Number (schema expects Number); strip non-digits first
    const phoneNum =
      v.phone && String(v.phone).trim() !== ''
        ? Number(String(v.phone).replace(/[^\d]/g, ''))
        : undefined;

    // Send date as "YYYY-MM-DD" (your controller normalizes to Date)
    const payload = {
      name: v.name!,
      email: v.email!,
      phone: phoneNum, // Number | undefined
      type: v.type!, // BookingType
      date: v.date!, // string (server will new Date(...))
      message: v.message || '',
      // status omitted -> defaults to 'new' on server
    };

    this.api.create(payload as any).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.form.reset({ type: 'wedding' });
      },
      error: (e) => {
        this.submitting.set(false);
        this.err.set(e?.error?.message || 'Failed to submit booking.');
      },
    });
  }
}
