import { Component, inject, signal, ViewChild, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RePortfolioService } from '../../../shared/services/re-portfolio.service';
import { REPortfolioProject } from '../../../shared/models/re-portfolio.model';
import { LightboxComponent } from '../../../shared/components/lightbox/lightbox.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-re-portfolio-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LightboxComponent],
  templateUrl: './re-portfolio-detail.component.html',
  styleUrls: ['./re-portfolio-detail.component.scss'],
})
export class RePortfolioDetailComponent implements OnInit {
  private api        = inject(RePortfolioService);
  private route      = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  loading = signal(true);
  error   = signal<string | null>(null);
  project = signal<REPortfolioProject | null>(null);

  @ViewChild(LightboxComponent) lb!: LightboxComponent;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    void this.load(slug);
  }

  async load(slug: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const p = await firstValueFrom(this.api.getBySlug(slug));
      this.project.set(p);
    } catch (e: any) {
      this.error.set(e?.status === 404 ? 'Project not found.' : 'Could not load project. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  openLightbox(index: number): void {
    const p = this.project();
    if (!p) return;
    // Build lightbox items from project images
    const lbItems = p.images.map(img => ({
      _id: img._id,
      url: img.url,
      thumbnail: img.thumbnail || img.url,
      title: img.alt || p.title,
    }));
    this.lb.open(lbItems as any, index);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }

  trackById = (_: number, img: { _id: string }) => img._id;
}
