import {
  Component,
  OnDestroy,
  signal,
  inject,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import {
  isPlatformBrowser,
  CommonModule,
  NgOptimizedImage,
} from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { GalleryService } from '../../shared/services/gallery.service';
import { TestimonialService } from '../../shared/services/testimonial.service';
import { GalleryItem } from '../../shared/models/gallery.model';
import { Testimonial } from '../../shared/models/testimonial.model';

type ServiceCard = {
  icon: string;
  title: string;
  copy: string;
  bullets: string[];
  ctaText: string;
  ctaLink: string | any[];
};

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, NgOptimizedImage],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private galleryApi = inject(GalleryService);
  private testiApi = inject(TestimonialService);

  // ====== DATA ======
  slider = signal<GalleryItem[]>([]);
  featured = signal<GalleryItem[]>([]);
  testimonials = signal<Testimonial[]>([]);

  loadingSlider = signal(true);
  loadingFeatured = signal(true);
  loadingTestimonials = signal(true);

  errorSlider = signal<string | null>(null);
  errorFeatured = signal<string | null>(null);
  errorTestimonials = signal<string | null>(null);

  // ====== SERVICES (six cards) ======
  services: ServiceCard[] = [
    {
      icon: '📷',
      title: 'Photography',
      copy: 'Editorial & documentary-style coverage, color-graded to a clean, timeless look.',
      bullets: [
        'Weddings & Engagements',
        'Portraits & Headshots',
        'Products & Branding',
      ],
      ctaText: 'Book photography →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🎬',
      title: 'Videography',
      copy: 'Story-driven films with cinematic motion, sound design, and tasteful pacing.',
      bullets: ['Wedding Highlight Films', 'Event Recaps', 'Brand Stories'],
      ctaText: 'Book videography →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🪄',
      title: 'Photo Editing',
      copy: 'Consistent tone, flattering skin, and refined color science for your images.',
      bullets: ['Pro Retouching', 'Color Grading', 'Batch Processing'],
      ctaText: 'Contact Us →',
      ctaLink: ['/contact'],
    },
    {
      icon: '✂️',
      title: 'Video Editing',
      copy: 'Snappy cuts, motion graphics, and sound mixing for social & web.',
      bullets: ['Short-form Reels', 'Ads & Promos', 'YouTube & Web'],
      ctaText: 'Contact Us →',
      ctaLink: ['/contact'],
    },
    {
      icon: '🌐',
      title: 'Website Development',
      copy: 'Fast, modern websites to showcase your brand and book more clients.',
      bullets: ['Modern Frontend', 'CMS & Hosting', 'SEO Basics'],
      ctaText: 'Contact Us →',
      ctaLink: ['/contact'],
    },
    {
      icon: '🎓',
      title: 'Online Tutoring',
      copy: 'Web Development & DevOps (incl. AWS Certification) with practical, career-focused guidance.',
      bullets: [
        'Tailored Curriculum',
        'Project Feedback',
        'Career Guidance',
        'Resume & LinkedIn Optimization',
      ],
      ctaText: 'Contact Us →',
      ctaLink: ['/contact'],
    },
  ];

  // ====== SLIDERS STATE ======
  index = signal(0); // hero slider
  tIndex = signal(0); // testimonials
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  private testiTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(
      () => {
        // Load dynamic content
        this.loadSlider();
        this.loadFeatured();
        this.loadTestimonials();

        if (isPlatformBrowser(this.platformId)) {
          this.startTimers();
          document.addEventListener('pointermove', this.onPointerMove, {
            passive: true,
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  // ---------- LOADERS ----------
  private async loadSlider() {
    this.loadingSlider.set(true);
    this.errorSlider.set(null);
    try {
      const res = await firstValueFrom(
        this.galleryApi.list({
          placement: 'slider', // server filters for landing slider items
          published: true,
          limit: 10,
          sort: 'order,-createdAt',
        })
      );
      const items: GalleryItem[] = res.items ?? [];
      this.slider.set(items);
      if (this.index() >= items.length) this.index.set(0);
    } catch (e: any) {
      console.error(e);
      this.errorSlider.set(e?.error?.message || 'Failed to load slider.');
      this.slider.set([]);
    } finally {
      this.loadingSlider.set(false);
    }
  }

  private async loadFeatured() {
    this.loadingFeatured.set(true);
    this.errorFeatured.set(null);
    try {
      const res = await firstValueFrom(
        this.galleryApi.list({
          placement: 'featured', // server filters for featured gallery
          published: true,
          limit: 12,
          sort: 'order,-createdAt',
        })
      );
      const items: GalleryItem[] = res.items ?? [];
      this.featured.set(items);
    } catch (e: any) {
      console.error(e);
      this.errorFeatured.set(e?.error?.message || 'Failed to load featured.');
      this.featured.set([]);
    } finally {
      this.loadingFeatured.set(false);
    }
  }

  private async loadTestimonials() {
    this.loadingTestimonials.set(true);
    this.errorTestimonials.set(null);
    try {
      const res = await firstValueFrom(
        this.testiApi.list({
          published: true,
          limit: 10,
          sort: 'order,-createdAt',
        })
      );
      const items: Testimonial[] = res.items ?? [];
      this.testimonials.set(items);
      if (this.tIndex() >= items.length) this.tIndex.set(0);
    } catch (e: any) {
      console.error(e);
      this.errorTestimonials.set(
        e?.error?.message || 'Failed to load testimonials.'
      );
      this.testimonials.set([]);
    } finally {
      this.loadingTestimonials.set(false);
    }
  }

  // ---------- AUTOPLAY ----------
  private startTimers() {
    this.stopTimers();
    this.heroTimer = setInterval(() => this.next(), 4500);
    this.testiTimer = setInterval(() => this.tNext(), 6000);
  }
  private stopTimers() {
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.testiTimer) clearInterval(this.testiTimer);
    this.heroTimer = null;
    this.testiTimer = null;
  }
  ngOnDestroy() {
    this.stopTimers();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('pointermove', this.onPointerMove);
    }
  }

  // ===== HERO slider controls =====
  next() {
    const len = this.slider().length || 1;
    this.index.update((i) => (i + 1) % len);
  }
  prev() {
    const len = this.slider().length || 1;
    this.index.update((i) => (i - 1 + len) % len);
  }
  go(i: number) {
    const len = this.slider().length || 1;
    this.index.set(Math.max(0, Math.min(i, len - 1)));
  }
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  // ===== TESTIMONIAL slider controls =====
  tNext() {
    const len = this.testimonials().length || 1;
    this.tIndex.update((i) => (i + 1) % len);
  }
  tPrev() {
    const len = this.testimonials().length || 1;
    this.tIndex.update((i) => (i - 1 + len) % len);
  }
  tGo(i: number) {
    const len = this.testimonials().length || 1;
    this.tIndex.set(Math.max(0, Math.min(i, len - 1)));
  }
  onKeyTestimonial(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.tNext();
    if (e.key === 'ArrowLeft') this.tPrev();
  }

  // ===== trackBy functions =====
  trackByGallery = (_: number, it: GalleryItem) => it._id!;
  trackByTestimonial = (_: number, it: Testimonial) => it._id ?? it.author;

  // Nice hover glow on .svc cards
  private onPointerMove = (ev: PointerEvent) => {
    const target = (ev.target as HTMLElement)?.closest?.(
      '.svc'
    ) as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    const y = ((ev.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--x', `${x}%`);
    target.style.setProperty('--y', `${y}%`);
  };
}
