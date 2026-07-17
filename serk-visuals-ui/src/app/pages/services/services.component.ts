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
      icon: '🏡',
      title: 'Real Estate Photography',
      copy: 'Professional property photography that helps listings attract serious buyers and sell faster. Interior, exterior, twilight, aerial, and video — all delivered within 24–48 hours.',
      bullets: [
        'Interior & Exterior Photography',
        'HDR Processing & Professional Editing',
        'Twilight & Blue-Hour Sessions',
        'Drone / Aerial Photography',
        'Walkthrough Video',
        '24–48 Hour Delivery',
      ],
      ctaText: 'View Pricing & Services →',
      ctaLink: ['/real-estate'],
    },
    {
      icon: '📐',
      title: 'Property Measurements & Floor Plans',
      copy: 'Accurate room-by-room measurements and 2D floor plan diagrams that give buyers a clear understanding of layout, proportions, and how spaces connect.',
      bullets: [
        'Accurate Square Footage Measurement',
        '2D Floor Plan Diagrams',
        'Room Labeling & Dimensions',
        'MLS & Marketing Ready Format',
        'Available as a Stand-Alone Service',
      ],
      ctaText: 'Book a Measurement →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🌅',
      title: 'Twilight Photography',
      copy: 'Blue-hour and twilight shoots that make listings glow — warm interior lights balanced with the dramatic colors of dusk for images that stop buyers mid-scroll.',
      bullets: [
        'Blue-Hour & Sunset Timing',
        'Interior + Exterior Blend',
        'Premium HDR Processing',
        'High-Impact Listing Hero Shots',
      ],
      ctaText: 'Book a Twilight Shoot →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🚁',
      title: 'Drone / Aerial Photography',
      copy: 'FAA-compliant drone photography that captures the full scope of a property — lot size, surroundings, neighborhood context, and views that ground-level cameras can\'t show.',
      bullets: [
        'FAA Part 107 Certified',
        'High-Resolution Aerial Stills',
        'Aerial Video Footage Available',
        'Lot, View & Neighborhood Context',
      ],
      ctaText: 'Add Drone to Your Booking →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🎬',
      title: 'Walkthrough Video',
      copy: 'Cinematic property walkthroughs that give online buyers a true feel for the layout and flow — reducing time-wasters and attracting more qualified showings.',
      bullets: [
        'Smooth Gimbal-Stabilized Video',
        'Room-by-Room Flow',
        'Branded or Unbranded Versions',
        'MLS & Social Media Ready',
      ],
      ctaText: 'Add Video to Your Booking →',
      ctaLink: ['/bookings'],
    },
    {
      icon: '🗺️',
      title: 'Virtual Tours & Floor Plans',
      copy: 'Interactive 360° virtual tours and accurate 2D floor plan diagrams — give remote buyers the confidence to make offers without an in-person visit.',
      bullets: [
        'Interactive 360° Virtual Tours',
        '2D Floor Plan Diagrams',
        'Room Labeling & Dimensions',
        'MLS & Marketing Ready Format',
      ],
      ctaText: 'Learn More →',
      ctaLink: ['/real-estate'],
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
