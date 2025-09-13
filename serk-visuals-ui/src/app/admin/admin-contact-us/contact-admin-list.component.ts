import {
  Component,
  computed,
  effect,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactUsService } from '../admin-shared/admin-contact-us/contact-us.service';
import { ContactItem } from '../admin-shared/admin-contact-us/contact-us.types';

@Component({
  standalone: true,
  selector: 'app-contact-admin-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-admin-list.component.html',
  styleUrls: ['./contact-admin-list.component.scss'],
})
export class ContactAdminListComponent {
  private api = inject(ContactUsService);

  // List state
  items = signal<ContactItem[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(10);
  status = signal<string>('');
  query = signal<string>('');
  loading = signal(false);
  error = signal<string | null>(null);

  // Modal state
  selected = signal<ContactItem | null>(null);
  modalOpen = computed(() => this.selected() !== null);

  pages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // auto-fetch on param changes without NG0600
  private _ref = effect(() => {
    const params = {
      page: this.page(),
      pageSize: this.pageSize(),
      status: this.status() || undefined,
      q: this.query() || undefined,
    };
    queueMicrotask(() => this.fetch(params));
  });

  private fetch(params: {
    page: number;
    pageSize: number;
    status?: string;
    q?: string;
  }) {
    this.loading.set(true);
    this.error.set(null);

    this.api.list(params).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error || 'Failed to load');
        this.loading.set(false);
      },
    });
  }

  onSearch() {
    this.page.set(1);
  }

  prevPage() {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }

  nextPage() {
    if (this.page() < this.pages()) this.page.set(this.page() + 1);
  }

  // === Modal open/close & mark-as-read ===
  openModal(item: ContactItem) {
    this.selected.set(item);
    // auto-mark as read if currently new
    if (item.status === 'new') {
      this.api.updateStatus(item.id, 'read').subscribe({
        next: (updated) => {
          // update selected + list cache
          this.selected.set(updated);
          this.items.update((xs) =>
            xs.map((x) => (x.id === updated.id ? updated : x))
          );
        },
        error: () => {
          // non-blocking: still keep modal open even if API fails
        },
      });
    }
  }

  closeModal() {
    this.selected.set(null);
  }

  // ESC to close
  @HostListener('document:keydown.escape', ['$event'])
  onEsc() {
    if (this.modalOpen()) this.closeModal();
  }

  changeStatus(item: ContactItem, status: 'new' | 'read' | 'replied') {
    this.api.updateStatus(item.id, status).subscribe({
      next: (updated) => {
        this.items.update((xs) =>
          xs.map((x) => (x.id === updated.id ? updated : x))
        );
        if (this.selected()?.id === updated.id) this.selected.set(updated);
      },
    });
  }

  delete(item: ContactItem) {
    if (!confirm('Delete this message?')) return;
    this.api.softDelete(item.id).subscribe({
      next: () => {
        this.items.update((xs) => xs.filter((x) => x.id !== item.id));
        this.total.update((n) => Math.max(0, n - 1));
        if (this.selected()?.id === item.id) this.closeModal();
      },
    });
  }

  trackById = (_: number, it: ContactItem) => it.id;
}
