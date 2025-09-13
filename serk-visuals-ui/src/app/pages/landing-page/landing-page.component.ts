import {
  Component,
  OnDestroy,
  signal,
  effect,
  inject,
  PLATFORM_ID,
  HostListener,
} from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
// import { HeaderComponent } from '../../header/header.component';
// import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnDestroy {
  // HERO slider
  slides = [0, 1, 2, 3, 4];
  index = signal(0);

  // TESTIMONIAL slider
  tSlides = [0, 1, 2, 3, 4];
  tIndex = signal(0);

  private platformId = inject(PLATFORM_ID);
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  private testiTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // auto-play
      this.heroTimer = setInterval(() => this.next(), 4500);
      this.testiTimer = setInterval(() => this.tNext(), 6000);
      // pointer glow on services (optional nicety)
      document.addEventListener('pointermove', this.onPointerMove, {
        passive: true,
      });
    }

    effect(() => {
      /* reactive-only UI work */
    });
  }

  ngOnDestroy() {
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.testiTimer) clearInterval(this.testiTimer);
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('pointermove', this.onPointerMove);
    }
  }

  // ===== HERO controls =====
  next() {
    this.index.update((i) => (i + 1) % this.slides.length);
  }
  prev() {
    this.index.update((i) => (i - 1 + this.slides.length) % this.slides.length);
  }
  go(i: number) {
    this.index.set(i);
  }
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  // ===== TESTIMONIAL controls =====
  tNext() {
    this.tIndex.update((i) => (i + 1) % this.tSlides.length);
  }
  tPrev() {
    this.tIndex.update(
      (i) => (i - 1 + this.tSlides.length) % this.tSlides.length
    );
  }
  tGo(i: number) {
    this.tIndex.set(i);
  }
  onKeyTestimonial(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.tNext();
    if (e.key === 'ArrowLeft') this.tPrev();
  }

  // Nice hover glow that follows the cursor on .svc cards
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
