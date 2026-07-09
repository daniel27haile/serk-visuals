import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PricingConfigService } from '../../shared/services/pricing-config.service';
import { PricingConfig, ServiceAddOn, PricingAdjustment } from '../../shared/models/pricing-config.model';

interface ReService {
  id: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-real-estate',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './real-estate.component.html',
  styleUrls: ['./real-estate.component.scss'],
})
export class RealEstateComponent implements OnInit {
  private readonly pricingApi = inject(PricingConfigService);
  private readonly platformId = inject(PLATFORM_ID);

  config  = signal<PricingConfig | null>(null);
  loading = signal(true);
  error   = signal<string | null>(null);

  readonly reServices: ReService[] = [
    {
      id: 'interior',
      title: 'Interior Photography',
      desc: 'Room-by-room coverage capturing natural light, space, and every key living area — from kitchens to master suites.',
    },
    {
      id: 'exterior',
      title: 'Exterior Photography',
      desc: 'Curb-appeal shots that highlight the facade, landscaping, and surroundings to make a strong first impression online.',
    },
    {
      id: 'twilight',
      title: 'Twilight Photography',
      desc: 'Golden-hour and blue-hour sessions that produce cinematic, warm-lit images that consistently outperform in listings.',
    },
    {
      id: 'drone',
      title: 'Drone / Aerial',
      desc: 'FAA-compliant aerial photography showing lot size, roof condition, neighborhood, and the full property context from above.',
    },
    {
      id: 'video',
      title: 'Walkthrough Video',
      desc: 'Smooth, cinematic video walkthroughs that let remote buyers experience the flow and feel of the property before visiting.',
    },
    {
      id: 'floorplan',
      title: 'Floor Plan',
      desc: 'Accurate 2D floor plan diagrams that give buyers a clear sense of layout, proportions, and how rooms connect.',
    },
    {
      id: 'virtual',
      title: 'Virtual / 3D Tour',
      desc: 'Interactive 360° tours that put buyers inside the property from any device — increasing engagement and qualified visits.',
    },
  ];

  readonly processSteps = [
    {
      num: '01',
      title: 'Book Online',
      desc: 'Select your services, preferred date, and provide property details. We confirm within 24 hours.',
    },
    {
      num: '02',
      title: 'We Shoot',
      desc: 'Our photographer arrives on time, works efficiently, and captures every space to its best advantage.',
    },
    {
      num: '03',
      title: 'Delivered Fast',
      desc: 'Professionally edited, web-ready images delivered within 24–48 hours — ready to list immediately.',
    },
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.pricingApi.getConfig('Real Estate').subscribe({
      next: cfg  => { this.config.set(cfg); this.loading.set(false); },
      error: ()  => { this.error.set('Pricing temporarily unavailable. Contact us for a quote.'); this.loading.set(false); },
    });
  }

  get includedAddOns(): ServiceAddOn[] {
    return this.config()?.serviceAddOns?.filter(a => a.included) ?? [];
  }

  get extraAddOns(): ServiceAddOn[] {
    return this.config()?.serviceAddOns?.filter(a => !a.included) ?? [];
  }

  get sizeAdjustments(): PricingAdjustment[] {
    return (this.config()?.propertySizeAdjustments ?? []).filter(a => a.priceAdjustment > 0);
  }

  get propertyTypeAdjustments(): PricingAdjustment[] {
    return (this.config()?.propertyTypeAdjustments ?? []).filter(a => a.priceAdjustment > 0);
  }

  get basePrice(): number {
    return this.config()?.basePrice ?? 250;
  }

  get isActive(): boolean {
    const cfg = this.config();
    return cfg == null || cfg.isActive !== false;
  }
}
