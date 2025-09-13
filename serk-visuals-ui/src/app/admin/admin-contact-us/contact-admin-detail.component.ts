import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContactUsService } from '../admin-shared/admin-contact-us/contact-us.service';
import { ContactItem } from '../admin-shared/admin-contact-us/contact-us.types';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-contact-admin-detail',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contact-admin-detail.component.html',
  styleUrls: ['./contact-admin-detail.component.scss'],
})
export class ContactAdminDetailComponent {
  private api = inject(ContactUsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  item = signal<ContactItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get(id).subscribe({
      next: (res) => {
        this.item.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Not found');
        this.loading.set(false);
      },
    });
  }

  save() {
    const i = this.item();
    if (!i) return;
    const payload = {
      fullName: i.fullName,
      email: i.email,
      subject: i.subject,
      message: i.message,
      reply: i.reply,
      status: i.status,
    };
    this.api.update(i.id, payload).subscribe({
      next: (updated) => this.item.set(updated),
    });
  }

  delete() {
    const i = this.item();
    if (!i) return;
    if (!confirm('Delete this message?')) return;
    this.api.softDelete(i.id).subscribe({
      next: () => this.router.navigateByUrl('/admin/contact'),
    });
  }
}
