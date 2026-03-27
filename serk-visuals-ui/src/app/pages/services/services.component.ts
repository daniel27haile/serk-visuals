import { Component, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type ServiceCard = {
  icon: string;
  title: string;
  copy: string;
  bullets: string[];
  ctaText: string;
  ctaLink: string | any[];
};

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);

  services: ServiceCard[] = [
    {
      icon: '📷',
      title: 'Photography & Videography',
      copy: 'Editorial & cinematic coverage — from stunning stills to story-driven films, all color-graded to a timeless look.',
      bullets: [
        'Weddings & Engagements',
        'Portraits & Headshots',
        'Wedding Highlight Films',
        'Brand Stories & Event Recaps',
      ],
      ctaText: 'Book a Session →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🪄',
      title: 'Photo & Video Editing',
      copy: 'Polished color science, clean cuts, and motion graphics for images and film alike.',
      bullets: [
        'Pro Retouching & Color Grading',
        'Batch Processing',
        'Short-form Reels & Ads',
        'YouTube & Web Videos',
      ],
      ctaText: 'Contact Us →',
      ctaLink: ['/contact'],
    },
  ];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('pointermove', this.onPointerMove, {
        passive: true,
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('pointermove', this.onPointerMove);
    }
  }

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
