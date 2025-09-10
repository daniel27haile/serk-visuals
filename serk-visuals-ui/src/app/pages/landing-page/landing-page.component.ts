import {
  Component,
  OnDestroy,
  signal,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
// import { HeaderComponent } from '../header/header.component';
// import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, HeaderComponent, FooterComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnDestroy {
  slides = [0, 1, 2, 3, 4];
  index = signal(0);

  private platformId = inject(PLATFORM_ID);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Only start timers in the browser (NEVER on the server)
    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => this.next(), 4500);
    }

    // safe effect (no async/timers here)
    effect(() => {
      /* reactive UI only */
    });
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

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
}
