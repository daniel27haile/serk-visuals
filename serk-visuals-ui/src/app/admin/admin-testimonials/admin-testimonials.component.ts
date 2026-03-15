import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  Testimonial,
  Paged,
  TestimonialCreateDTO,
  TestimonialUpdateDTO,
} from '../../shared/models/testimonial.model';
import { TestimonialService } from '../../shared/services/testimonial.service';
import { UploadService } from '../../shared/services/upload.service';

@Component({
  selector: 'app-admin-testimonials',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-testimonials.component.html',
  styleUrls: ['./admin-testimonials.component.scss'],
})
export class AdminTestimonialsComponent implements OnInit {
  private api = inject(TestimonialService);
  private uploadService = inject(UploadService);
  private fb = inject(FormBuilder);

  page = signal(1);
  limit = signal(12);
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  loading = signal(true);
  uploading = signal(false);
  error = signal<string | null>(null);

  items = signal<Testimonial[]>([]);
  editingId = signal<string | null>(null);

  // avatar is held as a File locally; it is uploaded to S3 on submit
  avatarFile = signal<File | null>(null);

  form = this.fb.group({
    author: ['', [Validators.required, Validators.minLength(2)]],
    role: [''],
    quote: ['', [Validators.required, Validators.minLength(6)]],
    published: [true],
    order: [0],
  });

  ngOnInit() {
    this.fetch();
  }

  async fetch() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.list({
          page: this.page(),
          limit: this.limit(),
          sort: 'order,-createdAt',
        })
      );
      this.items.set(res.items ?? []);
      this.total.set(res.total ?? 0);
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.error?.message || 'Failed to load testimonials.');
      this.items.set([]);
      this.total.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  goto(p: number) {
    if (p < 1 || p > this.pages()) return;
    this.page.set(p);
    this.fetch();
  }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.avatarFile.set(input.files?.[0] || null);
  }

  async submit() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue() as {
      author: string;
      role: string;
      quote: string;
      published: boolean;
      order: number;
    };

    this.uploading.set(true);
    this.error.set(null);

    try {
      // Upload avatar to S3 if a file was selected
      let avatarKey: string | undefined;
      if (this.avatarFile()) {
        avatarKey = await this.uploadService.upload(
          this.avatarFile()!,
          'uploads/testimonials'
        );
      }

      const id = this.editingId();

      if (id) {
        const patch: TestimonialUpdateDTO = {
          author: v.author,
          role: v.role || undefined,
          quote: v.quote,
          published: v.published,
          order: typeof v.order === 'number' ? v.order : undefined,
          avatarKey,
        };
        await firstValueFrom(this.api.update(id, patch));
      } else {
        const payload: TestimonialCreateDTO = {
          author: v.author,
          role: v.role || undefined,
          quote: v.quote,
          published: v.published,
          order: typeof v.order === 'number' ? v.order : undefined,
          avatarKey,
        };
        await firstValueFrom(this.api.create(payload));
      }

      this.cancelEdit();
      await this.fetch();
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.error?.message || e?.message || 'Failed to save testimonial.');
    } finally {
      this.uploading.set(false);
    }
  }

  edit(item: Testimonial) {
    this.editingId.set(item._id || null);
    this.form.reset({
      author: item.author || '',
      role: item.role || '',
      quote: item.quote || '',
      published: item.published !== false,
      order: typeof item.order === 'number' ? item.order : 0,
    });
    this.avatarFile.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({
      author: '',
      role: '',
      quote: '',
      published: true,
      order: 0,
    });
    this.avatarFile.set(null);
    const f = document.getElementById('avatar') as HTMLInputElement | null;
    if (f) f.value = '';
  }

  async remove(item: Testimonial) {
    if (!confirm(`Delete testimonial by "${item.author}"?`)) return;
    try {
      await firstValueFrom(this.api.remove(item._id!));
      await this.fetch();
    } catch (e) {
      console.error(e);
      alert('Failed to delete testimonial.');
    }
  }

  trackById = (_: number, it: Testimonial) => it._id ?? it.author;
}
