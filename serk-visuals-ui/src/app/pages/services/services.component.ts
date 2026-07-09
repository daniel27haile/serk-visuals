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
      icon: '💍',
      title: 'Wedding Photography & Films',
      copy: 'From the first look to the final dance — authentic, cinematic coverage of your wedding day. We capture the moments you\'ll want to relive for a lifetime.',
      bullets: [
        'Engagement Sessions',
        'Ceremony & Reception Coverage',
        'Wedding Highlight Films',
        'Same-Day Edits Available',
      ],
      ctaText: 'Book Your Date →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🎉',
      title: 'Event Photography',
      copy: 'Conferences, fundraisers, milestone birthdays, and corporate gatherings — every important moment documented with professionalism and care.',
      bullets: [
        'Corporate Events & Conferences',
        'Birthday & Anniversary Parties',
        'Galas & Fundraisers',
        'Quick Turnaround Available',
      ],
      ctaText: 'Book an Event →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🖼️',
      title: 'Portrait Sessions',
      copy: 'Headshots, family portraits, and individual sessions crafted to make you look and feel your best — in studio or on location.',
      bullets: [
        'Professional Headshots',
        'Family & Lifestyle Portraits',
        'Senior & Graduation Photos',
        'Creative & Studio Sessions',
      ],
      ctaText: 'Book a Portrait →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '✨',
      title: 'Branding Photography',
      copy: 'Visuals that tell your brand\'s story — ideal for websites, social media, and marketing campaigns that need to make a strong impression.',
      bullets: [
        'Personal Brand Sessions',
        'Product & Lifestyle Photography',
        'Team & Company Culture Photos',
        'Social Media Content Packages',
      ],
      ctaText: 'Book a Brand Shoot →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🏡',
      title: 'Real Estate Photography',
      copy: 'Professional property photography that helps listings attract serious buyers and sell faster — delivered within 24–48 hours.',
      bullets: [
        'Interior & Exterior Photography',
        'Twilight & Drone Aerial Shots',
        'Walkthrough Video & Virtual Tours',
        'Floor Plans Available',
        '24–48 Hour Delivery',
      ],
      ctaText: 'Learn More →',
      ctaLink: ['/real-estate'],
    },
    {
      icon: '🪄',
      title: 'Photo & Video Editing',
      copy: 'Professional color grading, retouching, and post-production for photos and footage — whether we shot it or you did.',
      bullets: [
        'Color Grading & Retouching',
        'Batch Photo Editing',
        'Short-form Reels & Ads',
        'YouTube & Web Videos',
      ],
      ctaText: 'Get in Touch →',
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
