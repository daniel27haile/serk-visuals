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

@Component({
  selector: 'app-admin-testimonials',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-testimonials.component.html',
  styleUrls: ['./admin-testimonials.component.scss'],
})
export class AdminTestimonialsComponent implements OnInit {
  private api = inject(TestimonialService);
  private fb = inject(FormBuilder);

  // pagination + state
  page = signal(1);
  limit = signal(12);
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  loading = signal(true);
  error = signal<string | null>(null);

  // data
  items = signal<Testimonial[]>([]);
  editingId = signal<string | null>(null);

  // strictly-typed form (no nulls for required strings)
  form = this.fb.group({
    author: ['', [Validators.required, Validators.minLength(2)]],
    role: [''],
    quote: ['', [Validators.required, Validators.minLength(6)]],
    published: [true],
    order: [0],
    avatar: [null as File | null],
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
    const file = input.files?.[0] || null;
    this.form.patchValue({ avatar: file });
  }

  async submit() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue() as {
      author: string;
      role: string;
      quote: string;
      published: boolean;
      order: number;
      avatar: File | null;
    };

    try {
      const id = this.editingId();

      if (id) {
        const patch: TestimonialUpdateDTO = {
          author: v.author,
          role: v.role || undefined,
          quote: v.quote,
          published: v.published,
          order: typeof v.order === 'number' ? v.order : undefined,
          avatar: v.avatar ?? undefined,
        };
        await firstValueFrom(this.api.update(id, patch));
      } else {
        const payload: TestimonialCreateDTO = {
          author: v.author,
          role: v.role || undefined,
          quote: v.quote,
          published: v.published,
          order: typeof v.order === 'number' ? v.order : undefined,
          avatar: v.avatar ?? undefined,
        };
        await firstValueFrom(this.api.create(payload));
      }

      this.cancelEdit();
      await this.fetch();
    } catch (e) {
      console.error(e);
      alert('Failed to save testimonial.');
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
      avatar: null,
    });
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
      avatar: null,
    });
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
