import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RePortfolioService } from '../../shared/services/re-portfolio.service';
import { UploadService } from '../../shared/services/upload.service';
import { REPortfolioProject, PropertyType } from '../../shared/models/re-portfolio.model';
import { firstValueFrom } from 'rxjs';

type View = 'list' | 'form' | 'images';

const PROPERTY_TYPES: PropertyType[] = [
  'Residential', 'Luxury', 'Condo', 'Townhome', 'Commercial', 'Vacant Land', 'Other',
];

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Component({
  selector: 'app-admin-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-portfolio.component.html',
  styleUrls: ['./admin-portfolio.component.scss'],
})
export class AdminPortfolioComponent implements OnInit {
  private api           = inject(RePortfolioService);
  private uploadService = inject(UploadService);
  private fb            = inject(FormBuilder);

  readonly propertyTypes = PROPERTY_TYPES;

  // ── View state ────────────────────────────────────────────────────────────
  view         = signal<View>('list');
  editingId    = signal<string | null>(null);
  activeProject = signal<REPortfolioProject | null>(null);

  // ── List state ────────────────────────────────────────────────────────────
  readonly listLimit = 20;
  listPage    = signal(1);
  listLoading = signal(true);
  listError   = signal<string | null>(null);
  projects    = signal<REPortfolioProject[]>([]);
  listTotal   = signal(0);
  listPages   = computed(() => Math.max(1, Math.ceil(this.listTotal() / this.listLimit)));

  // ── Form state ────────────────────────────────────────────────────────────
  formSaving   = signal(false);
  formError    = signal<string | null>(null);
  coverPreview = signal<string | null>(null);

  form = this.fb.group({
    title:        ['', [Validators.required, Validators.minLength(2)]],
    slug:         ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    propertyType: ['Residential' as PropertyType, Validators.required],
    location:     [''],
    description:  [''],
    featured:     [false],
    published:    [false],
    order:        [0],
    coverImage:   [null as File | null],
  });

  // ── Image management state ────────────────────────────────────────────────
  imgUploading  = signal(false);
  imgError      = signal<string | null>(null);
  imgFile       = signal<File | null>(null);
  imgAlt        = signal('');

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    void this.loadList();
  }

  // ── List ──────────────────────────────────────────────────────────────────
  async loadList(): Promise<void> {
    this.listLoading.set(true);
    this.listError.set(null);
    try {
      const res = await firstValueFrom(this.api.adminList({ page: this.listPage(), limit: this.listLimit }));
      this.projects.set(res.items ?? []);
      this.listTotal.set(res.total ?? 0);
    } catch {
      this.listError.set('Failed to load projects.');
    } finally {
      this.listLoading.set(false);
    }
  }

  gotoPage(p: number): void {
    if (p < 1 || p > this.listPages()) return;
    this.listPage.set(p);
    void this.loadList();
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  openCreate(): void {
    this.editingId.set(null);
    this.coverPreview.set(null);
    this.formError.set(null);
    this.form.reset({ title: '', slug: '', propertyType: 'Residential', location: '', description: '', featured: false, published: false, order: 0, coverImage: null });
    this.view.set('form');
  }

  openEdit(p: REPortfolioProject): void {
    this.editingId.set(p._id);
    this.coverPreview.set(p.coverThumbUrl || p.coverUrl);
    this.formError.set(null);
    this.form.reset({
      title:        p.title,
      slug:         p.slug,
      propertyType: p.propertyType,
      location:     p.location     ?? '',
      description:  p.description  ?? '',
      featured:     p.featured,
      published:    p.published,
      order:        p.order,
      coverImage:   null,
    });
    this.view.set('form');
  }

  openImages(p: REPortfolioProject): void {
    this.activeProject.set(p);
    this.imgFile.set(null);
    this.imgAlt.set('');
    this.imgError.set(null);
    this.view.set('images');
  }

  backToList(): void {
    this.view.set('list');
    this.editingId.set(null);
    this.activeProject.set(null);
    void this.loadList();
  }

  // ── Slug auto-generation ──────────────────────────────────────────────────
  autoSlug(): void {
    const title = this.form.value.title ?? '';
    this.form.patchValue({ slug: toSlug(title) });
  }

  // ── Cover file ────────────────────────────────────────────────────────────
  onCoverFile(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0] || null;
    this.form.patchValue({ coverImage: file });
    if (file) {
      const url = URL.createObjectURL(file);
      this.coverPreview.set(url);
    }
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  async submitForm(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const id = this.editingId();

    if (!id && !v.coverImage) {
      this.formError.set('A cover image is required for new projects.');
      return;
    }

    this.formSaving.set(true);
    this.formError.set(null);
    try {
      let coverImageKey: string | undefined;
      let coverThumbKey: string | undefined;

      if (v.coverImage) {
        const upload = await this.uploadService.upload(v.coverImage, 'uploads/portfolio');
        coverImageKey = upload.key;
        const thumb = await this.generateThumbnail(v.coverImage);
        if (thumb) {
          const thumbUpload = await this.uploadService.upload(thumb, 'uploads/portfolio');
          coverThumbKey = thumbUpload.key;
        }
      }

      const payload: Record<string, unknown> = {
        title:        v.title,
        slug:         v.slug,
        propertyType: v.propertyType,
        location:     v.location,
        description:  v.description,
        featured:     !!v.featured,
        published:    !!v.published,
        order:        Number(v.order ?? 0),
      };
      if (coverImageKey) {
        payload['coverImageKey'] = coverImageKey;
        if (coverThumbKey) payload['coverThumbKey'] = coverThumbKey;
      }

      if (id) {
        await firstValueFrom(this.api.adminUpdate(id, payload));
      } else {
        await firstValueFrom(this.api.adminCreate(payload));
      }

      this.backToList();
    } catch (e: any) {
      this.formError.set(e?.error?.message || e?.message || 'Failed to save project.');
    } finally {
      this.formSaving.set(false);
    }
  }

  // ── Delete project ────────────────────────────────────────────────────────
  async deleteProject(p: REPortfolioProject): Promise<void> {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await firstValueFrom(this.api.adminDelete(p._id));
      void this.loadList();
    } catch {
      alert('Failed to delete project.');
    }
  }

  // ── Image management ──────────────────────────────────────────────────────
  onImgFile(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0] || null;
    this.imgFile.set(file);
  }

  async addImage(): Promise<void> {
    const file = this.imgFile();
    const project = this.activeProject();
    if (!file || !project) return;

    this.imgUploading.set(true);
    this.imgError.set(null);
    try {
      const upload = await this.uploadService.upload(file, 'uploads/portfolio');
      const thumb  = await this.generateThumbnail(file);
      let thumbKey: string | undefined;
      if (thumb) {
        const t = await this.uploadService.upload(thumb, 'uploads/portfolio');
        thumbKey = t.key;
      }

      const nextOrder = Math.max(0, ...(project.images.map(i => i.order))) + 1;
      const updated = await firstValueFrom(
        this.api.adminAddImage(project._id, {
          imageKey: upload.key,
          thumbKey,
          alt:      this.imgAlt(),
          order:    nextOrder,
        })
      );
      this.activeProject.set(updated);
      this.imgFile.set(null);
      this.imgAlt.set('');
      const el = document.getElementById('img-file-input') as HTMLInputElement | null;
      if (el) el.value = '';
    } catch (e: any) {
      this.imgError.set(e?.error?.message || 'Failed to upload image.');
    } finally {
      this.imgUploading.set(false);
    }
  }

  async removeImage(imgId: string): Promise<void> {
    const project = this.activeProject();
    if (!project || !confirm('Remove this image?')) return;
    try {
      const updated = await firstValueFrom(this.api.adminRemoveImage(project._id, imgId));
      this.activeProject.set(updated);
    } catch {
      alert('Failed to remove image.');
    }
  }

  async moveImageUp(imgId: string): Promise<void> {
    const project = this.activeProject();
    if (!project) return;
    const imgs = [...project.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx  = imgs.findIndex(i => i._id === imgId);
    if (idx <= 0) return;
    const above = imgs[idx - 1];
    try {
      const updated = await firstValueFrom(
        this.api.adminReorderImages(project._id, [
          { id: imgId,       order: above.order ?? (idx - 1) },
          { id: above._id!,  order: imgs[idx].order ?? idx },
        ])
      );
      this.activeProject.set(updated);
    } catch { /* swallow */ }
  }

  async moveImageDown(imgId: string): Promise<void> {
    const project = this.activeProject();
    if (!project) return;
    const imgs = [...project.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx  = imgs.findIndex(i => i._id === imgId);
    if (idx >= imgs.length - 1) return;
    const below = imgs[idx + 1];
    try {
      const updated = await firstValueFrom(
        this.api.adminReorderImages(project._id, [
          { id: imgId,       order: below.order ?? (idx + 1) },
          { id: below._id!,  order: imgs[idx].order ?? idx },
        ])
      );
      this.activeProject.set(updated);
    } catch { /* swallow */ }
  }

  // ── Thumbnail generation ──────────────────────────────────────────────────
  private generateThumbnail(file: File, maxWidth = 800, quality = 0.75): Promise<File | null> {
    return new Promise(resolve => {
      if (!file.type.startsWith('image/')) { resolve(null); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
        const w = Math.round(img.naturalWidth  * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (!blob) { resolve(null); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '_thumb.webp', { type: 'image/webp' }));
        }, 'image/webp', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }

  trackById = (_: number, p: { _id: string }) => p._id;
  get slugInvalid(): boolean {
    const c = this.form.get('slug');
    return !!(c?.invalid && c?.touched);
  }
}
