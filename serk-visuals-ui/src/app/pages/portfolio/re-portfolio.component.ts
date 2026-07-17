import { Component, inject, signal, computed, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RePortfolioService } from '../../shared/services/re-portfolio.service';
import { REPortfolioProject } from '../../shared/models/re-portfolio.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-re-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './re-portfolio.component.html',
  styleUrls: ['./re-portfolio.component.scss'],
})
export class RePortfolioComponent implements OnInit {
  private api        = inject(RePortfolioService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  readonly limit = 12;

  loading     = signal(true);
  loadingMore = signal(false);
  error       = signal<string | null>(null);
  items       = signal<REPortfolioProject[]>([]);
  total       = signal(0);
  page        = signal(1);
  pages       = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));
  hasMore     = computed(() => this.page() < this.pages());

  ngOnInit(): void {
    void this.load(1, false);
  }

  async load(p: number, append: boolean): Promise<void> {
    if (append) this.loadingMore.set(true);
    else        this.loading.set(true);
    this.error.set(null);

    try {
      const res = await firstValueFrom(this.api.list({ page: p, limit: this.limit }));
      this.total.set(res.total ?? 0);
      this.page.set(p);
      this.items.set(append ? [...this.items(), ...(res.items ?? [])] : (res.items ?? []));
    } catch {
      this.error.set('Could not load portfolio. Please try again.');
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  loadMore(): void {
    void this.load(this.page() + 1, true);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('img--broken');
    img.removeAttribute('src');
  }

  trackById = (_: number, p: REPortfolioProject) => p._id;
}
