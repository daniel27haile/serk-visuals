// src/app/contact-us/contact-us.component.ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
// import { HttpClientModule } from '@angular/common/http';
import { ContactUsService } from '../../shared/services/contact-us.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss'],
})
export class ContactUsComponent {
  private fb = inject(NonNullableFormBuilder);
  private svc = inject(ContactUsService);
  private destroyRef = inject(DestroyRef);

  // UI state with signals
  submitting = signal(false);
  submitted = signal(false);
  serverError = signal<string | null>(null);

  form = this.fb.group({
    fullName: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
      ],
      updateOn: 'blur',
    }),
    email: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(120),
      ],
      updateOn: 'blur',
    }),
    subject: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ],
      updateOn: 'blur',
    }),
    message: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000),
      ],
      updateOn: 'change',
    }),
    // Honeypot field (hidden in UI). If filled → ignore server call.
    hp: this.fb.control<string>(''),
    // Optional consent checkbox (not required by backend)
    consent: this.fb.control<boolean>(true),
  });

  // Convenience getter
  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.serverError.set(null);
    this.submitted.set(false);

    // Bot check
    if (this.form.value.hp) {
      console.log('value.hp filled:', this.form.value.hp);
      // Silently succeed (pretend it worked)
      this.form.reset({
        fullName: '',
        email: '',
        subject: '',
        message: '',
        hp: '',
        consent: true,
      });
      this.submitted.set(true);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.svc
      .create({
        fullName: this.f.fullName.value.trim(),
        email: this.f.email.value.trim(),
        subject: this.f.subject.value.trim(),
        message: this.f.message.value.trim(),
        hp: '',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.form.reset({
            fullName: '',
            email: '',
            subject: '',
            message: '',
            hp: '',
            consent: true,
          });
        },
        error: (err) => {
          this.submitting.set(false);
          const msg =
            err?.error?.error || 'Something went wrong. Please try again.';
          this.serverError.set(msg);
        },
      });
  }
}
