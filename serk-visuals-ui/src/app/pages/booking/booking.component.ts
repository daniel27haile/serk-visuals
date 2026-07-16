import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { BookingsService } from '../../shared/services/booking.service';
import { PricingConfigService } from '../../shared/services/pricing-config.service';
import { Booking, SessionType, PreferredContactMethod } from '../../shared/models/booking.model';
import { PricingConfig, PricingBreakdown, ProductPricingBreakdown, PackageConfig } from '../../shared/models/pricing-config.model';
import { formatBookingDate } from '../../shared/utils/booking-format.util';
import { AvailabilityModalComponent, SelectedSlot } from '../../shared/components/availability-modal/availability-modal.component';
import { BookingSummaryComponent } from '../../shared/components/booking-summary/booking-summary.component';
import { SESSION_CONFIGS, SessionConfig } from '../../shared/config/session-config';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AvailabilityModalComponent, BookingSummaryComponent],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingFormPage {
  private readonly fb          = inject(NonNullableFormBuilder);
  private readonly api         = inject(BookingsService);
  private readonly pricingApi  = inject(PricingConfigService);
  private readonly route       = inject(ActivatedRoute);

  readonly sessionTypes: { value: SessionType; label: string }[] = [
    { value: 'Real Estate',   label: 'Real Estate Photography'},
    { value: 'Wedding',       label: 'Wedding Photography'    },
    { value: 'Portrait',      label: 'Portrait Session'       },
    { value: 'Family',        label: 'Family Session'         },
    { value: 'Event',         label: 'Event Coverage'         },
    { value: 'Graduation',    label: 'Graduation Session'     },
    { value: 'Commercial',    label: 'Commercial / Branding'  },
    { value: 'Engagement',    label: 'Engagement Session'     },
    { value: 'Birthday',      label: 'Birthday Session'       },
    { value: 'Product',       label: 'Product Photography'    },
    { value: 'Personal',      label: 'Personal Session'       },
    { value: 'Other',         label: 'Other'                  },
  ];

  readonly contactMethods = ['Email', 'Phone', 'Text Message'];

  // Modal state
  modalOpen    = signal(false);
  selectedSlot = signal<SelectedSlot | null>(null);
  estimatedPrice   = signal<number | null>(null);

  submitting = signal(false);
  submitted  = signal(false);
  err        = signal<string | null>(null);
  success    = signal<{ when: string; duration: number; email?: string; location?: string; type?: string } | null>(null);

  // Dynamic pricing (Real Estate + Product Photography)
  pricingConfig            = signal<PricingConfig | null>(null);
  pricingConfigLoading     = signal(false);
  pricingConfigError       = signal<string | null>(null);
  pricingBreakdown         = signal<PricingBreakdown | null>(null);
  productPricingBreakdown  = signal<ProductPricingBreakdown | null>(null);

  private readonly defaultType: SessionType = 'Real Estate';

  // Session-type-specific dynamic fields — rebuilt when type changes
  readonly bookingDetails: FormGroup = new FormGroup({});

  form = this.fb.group({
    name:                   this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email:                  this.fb.control('', [Validators.required, Validators.email]),
    phone:                  this.fb.control(''),
    type:                   this.fb.control<SessionType>(this.defaultType),
    location:               this.fb.control('', [Validators.required]),
    preferredContactMethod: this.fb.control<PreferredContactMethod>(''),
    durationMinutes:        this.fb.control(60),
    message:                this.fb.control(''),
  });

  get phoneRequired(): boolean {
    const v = this.form.controls.preferredContactMethod.value;
    return v === 'Phone' || v === 'Text Message';
  }

  constructor() {
    // Dynamically require phone when contact method is Phone or Text Message
    this.form.controls.preferredContactMethod.valueChanges.subscribe(method => {
      const phoneCtrl = this.form.controls.phone;
      if (method === 'Phone' || method === 'Text Message') {
        phoneCtrl.addValidators(Validators.required);
      } else {
        phoneCtrl.removeValidators(Validators.required);
      }
      phoneCtrl.updateValueAndValidity();
    });

    this.form.controls.type.valueChanges.subscribe(type => {
      this.rebuildDetailsGroup(type as SessionType);
      if (type === 'Real Estate' || type === 'Product' || type === 'Wedding') {
        this.fetchPricingConfig();
      } else {
        this.pricingConfig.set(null);
        this.pricingBreakdown.set(null);
        this.productPricingBreakdown.set(null);
      }
      // Clear slot when session type changes — duration requirements may differ
      this.selectedSlot.set(null);
      this.updateEstimate();
    });

    this.form.controls.durationMinutes.valueChanges.subscribe(() => this.updateEstimate());
    this.bookingDetails.valueChanges.subscribe(() => {
      this.checkPackageDurationConflict();
      this.updateEstimate();
    });

    this.rebuildDetailsGroup(this.defaultType);
    this.updateEstimate();

    // Pre-select session type from ?type= query param (e.g. from /real-estate CTA)
    const qType = this.route.snapshot.queryParamMap.get('type') as SessionType;
    if (qType && SESSION_CONFIGS[qType]) {
      this.form.controls.type.setValue(qType);
    } else if (['Real Estate', 'Wedding', 'Product'].includes(this.defaultType)) {
      // valueChanges doesn't fire for the initial form value, so fetch pricing explicitly
      this.fetchPricingConfig();
    }
  }

  // ── Config helpers ──────────────────────────────────────

  get currentConfig(): SessionConfig {
    const type = this.form.controls.type.value as SessionType;
    return SESSION_CONFIGS[type] ?? SESSION_CONFIGS['Other'];
  }

  get pricingLabel(): string {
    return this.currentConfig.pricing.startingLabel ?? '';
  }

  get isRealEstate(): boolean {
    return this.form.controls.type.value === 'Real Estate';
  }

  get isProduct(): boolean {
    return this.form.controls.type.value === 'Product';
  }

  get locationLabel(): string {
    return this.isRealEstate ? 'Property Address' : 'Location / Venue';
  }

  get locationPlaceholder(): string {
    return this.isRealEstate
      ? 'Property address (street, city, state, zip)'
      : 'Address, park, studio, etc.';
  }

  /**
   * Returns the duration in minutes locked by the currently selected package,
   * or null when duration should be chosen freely by the user.
   * Checks backend-fetched packages first (admin-managed), then frontend defaults.
   */
  get packageDurationMinutes(): number | null {
    const cfg = this.currentConfig;
    if (cfg.pricing.strategy !== 'package') return null;
    const details     = this.bookingDetails.getRawValue() as Record<string, unknown>;
    const backendPkgs = this.pricingConfig()?.packages;
    for (const field of cfg.fields) {
      const val = details[field.key] as string;
      if (!val) continue;
      // Backend config takes precedence (admin-managed price + duration)
      if (backendPkgs?.length) {
        const bPkg = backendPkgs.find(p => p.value === val && p.isActive !== false);
        if (bPkg?.durationMinutes) return bPkg.durationMinutes;
      }
      // Fallback to frontend config
      const pkg = cfg.pricing.packages?.find(p => p.value === val);
      if (pkg?.durationMinutes) return pkg.durationMinutes;
    }
    return null;
  }

  get currentSummaryDetails(): { label: string; value: string }[] {
    const cfg     = this.currentConfig;
    const details = this.bookingDetails.getRawValue() as Record<string, unknown>;
    return cfg.summaryFields
      .filter(key => key !== 'services' || !this.isRealEstate) // services shown in breakdown for RE
      .map(key => {
        const raw   = details[key];
        const value = Array.isArray(raw) ? (raw as string[]).join(', ') : String(raw ?? '');
        const field = cfg.fields.find(f => f.key === key);
        return { label: field?.label ?? key, value };
      })
      .filter(e => e.value.trim() !== '');
  }

  // ── Dynamic pricing ─────────────────────────────────────

  private fetchPricingConfig(): void {
    const type = this.form.controls.type.value;
    if (type !== 'Real Estate' && type !== 'Product' && type !== 'Wedding') return;
    this.pricingConfigLoading.set(true);
    this.pricingConfigError.set(null);
    this.pricingApi.getConfig(type).subscribe({
      next: cfg => {
        this.pricingConfig.set(cfg);
        this.pricingConfigLoading.set(false);
        this.updateEstimate();
      },
      error: () => {
        this.pricingConfigLoading.set(false);
        this.pricingConfigError.set('Could not load pricing. Prices shown are estimates.');
      },
    });
  }

  /** Returns "+$X", "Included", "$X", or "" for a field option — used in template. */
  getPriceLabel(fieldKey: string, optValue: string): string {
    const pricing = this.pricingConfig();
    if (!pricing || !optValue) return '';

    // Real Estate fields
    if (fieldKey === 'services') {
      const addOn = pricing.serviceAddOns?.find(a => a.value === optValue);
      if (!addOn) return '';
      return addOn.included ? 'Included' : `+$${addOn.price}`;
    }
    if (fieldKey === 'propertyType') {
      const adj = pricing.propertyTypeAdjustments?.find(a => a.value === optValue);
      if (!adj || adj.priceAdjustment === 0) return '';
      return adj.priceAdjustment > 0 ? `+$${adj.priceAdjustment}` : `-$${Math.abs(adj.priceAdjustment)}`;
    }
    if (fieldKey === 'propertySize') {
      const adj = pricing.propertySizeAdjustments?.find(a => a.value === optValue);
      if (!adj || adj.priceAdjustment === 0) return '';
      return adj.priceAdjustment > 0 ? `+$${adj.priceAdjustment}` : `-$${Math.abs(adj.priceAdjustment)}`;
    }

    // Product Photography fields
    if (fieldKey === 'deliverables') {
      const tier = pricing.deliverableTiers?.find(t => t.value === optValue);
      if (!tier) return '';
      return `$${tier.price}`;
    }
    if (fieldKey === 'productType') {
      const adj = pricing.categoryAdjustments?.find(a => a.value === optValue);
      if (!adj || adj.priceAdjustment === 0) return '';
      return adj.priceAdjustment > 0 ? `+$${adj.priceAdjustment}` : `-$${Math.abs(adj.priceAdjustment)}`;
    }

    return '';
  }

  // ── Dynamic fields ──────────────────────────────────────

  private rebuildDetailsGroup(type: SessionType): void {
    Object.keys(this.bookingDetails.controls).forEach(k =>
      this.bookingDetails.removeControl(k)
    );

    const cfg = SESSION_CONFIGS[type] ?? SESSION_CONFIGS['Other'];
    for (const field of cfg.fields) {
      if (field.type === 'checkbox-group') {
        this.bookingDetails.addControl(field.key, new FormControl<string[]>([]));
      } else {
        const validators = field.required ? [Validators.required] : [];
        this.bookingDetails.addControl(field.key, new FormControl('', validators));
      }
    }
  }

  isChecked(key: string, value: string): boolean {
    const ctrl = this.bookingDetails.get(key);
    return Array.isArray(ctrl?.value) && (ctrl.value as string[]).includes(value);
  }

  onCheckboxChange(key: string, value: string, checked: boolean): void {
    const ctrl = this.bookingDetails.get(key);
    if (!ctrl || !Array.isArray(ctrl.value)) return;
    const current = [...(ctrl.value as string[])];
    if (checked) {
      if (!current.includes(value)) current.push(value);
    } else {
      const idx = current.indexOf(value);
      if (idx > -1) current.splice(idx, 1);
    }
    ctrl.setValue(current);
  }

  // ── Modal ───────────────────────────────────────────────

  openModal(): void  { this.modalOpen.set(true); }
  onModalClosed(): void { this.modalOpen.set(false); }

  onSlotSelected(slot: SelectedSlot): void {
    // If a package locks the duration, enforce it regardless of what the modal emits
    const locked = this.packageDurationMinutes;
    const finalSlot = locked !== null ? { ...slot, durationMinutes: locked } : slot;
    this.selectedSlot.set(finalSlot);
    this.form.controls.durationMinutes.setValue(finalSlot.durationMinutes);
    this.err.set(null);
    this.updateEstimate();
  }

  clearSlot(): void { this.selectedSlot.set(null); }

  // ── Package duration enforcement ─────────────────────────

  /**
   * Called whenever bookingDetails change. If a package is selected whose
   * duration doesn't match the existing slot, clears the slot and shows a
   * message so the user re-selects a valid time for the new duration.
   */
  private checkPackageDurationConflict(): void {
    const locked = this.packageDurationMinutes;
    if (locked === null) return;
    const slot = this.selectedSlot();
    if (!slot) return;
    if (slot.durationMinutes !== locked) {
      this.selectedSlot.set(null);
      this.err.set(
        `Package duration changed to ${this.formatDuration(locked)}. Please re-select your date and time.`
      );
    }
  }

  private formatDuration(mins: number): string {
    if (mins < 60) return `${mins} min`;
    if (mins === 60) return '1 hr';
    return `${mins / 60} hrs`;
  }

  // ── Pricing ─────────────────────────────────────────────

  private updateEstimate(): void {
    const cfg      = this.currentConfig;
    const duration = this.form.controls.durationMinutes.value ?? 60;

    if (cfg.pricing.strategy === 'dynamic') {
      this.updateDynamicEstimate();
      return;
    }

    this.pricingBreakdown.set(null);

    switch (cfg.pricing.strategy) {
      case 'hourly':
        this.estimatedPrice.set(
          Math.round((cfg.pricing.hourlyRate ?? 175) * (duration / 60))
        );
        break;

      case 'package': {
        let price: number | null = null;
        const details     = this.bookingDetails.getRawValue() as Record<string, unknown>;
        const backendPkgs = this.pricingConfig()?.packages;
        for (const field of cfg.fields) {
          const val = details[field.key] as string;
          if (!val) continue;
          // Backend config takes precedence (admin-managed price)
          if (backendPkgs?.length) {
            const bPkg = backendPkgs.find((p: PackageConfig) => p.value === val && p.isActive !== false);
            if (bPkg) { price = bPkg.price; break; }
          }
          // Fallback to frontend config
          const pkg = cfg.pricing.packages?.find(p => p.value === val);
          if (pkg) { price = pkg.price; break; }
        }
        this.estimatedPrice.set(price);
        break;
      }

      case 'starting':
        this.estimatedPrice.set(cfg.pricing.startingPrice ?? null);
        break;
    }
  }

  private updateDynamicEstimate(): void {
    const pricing = this.pricingConfig();
    if (!pricing) {
      this.estimatedPrice.set(null);
      this.pricingBreakdown.set(null);
      this.productPricingBreakdown.set(null);
      return;
    }
    if (this.isRealEstate) {
      this.updateRealEstateEstimate(pricing);
    } else if (this.isProduct) {
      this.updateProductEstimate(pricing);
    }
  }

  private updateRealEstateEstimate(pricing: PricingConfig): void {
    const details      = this.bookingDetails.getRawValue() as Record<string, unknown>;
    const propertyType = (details['propertyType'] as string) || '';
    const propertySize = (details['propertySize'] as string) || '';
    const services     = (details['services'] as string[]) || [];

    const typeAdj    = pricing.propertyTypeAdjustments?.find(a => a.value === propertyType);
    const sizeAdj    = pricing.propertySizeAdjustments?.find(a => a.value === propertySize);
    const typeAdjAmt = typeAdj?.priceAdjustment ?? 0;
    const sizeAdjAmt = sizeAdj?.priceAdjustment ?? 0;

    let total = pricing.basePrice + typeAdjAmt + sizeAdjAmt;

    const selectedServices: { label: string; price: number; included: boolean }[] = [];
    for (const svc of services) {
      const addOn = pricing.serviceAddOns?.find(a => a.value === svc);
      if (addOn) {
        const price = addOn.included ? 0 : addOn.price;
        total += price;
        selectedServices.push({ label: addOn.label, price, included: addOn.included });
      }
    }

    const breakdown: PricingBreakdown = {
      basePrice:              pricing.basePrice,
      propertyTypeLabel:      typeAdj?.label ?? null,
      propertyTypeAdjustment: typeAdjAmt,
      propertySizeLabel:      sizeAdj?.label ?? null,
      propertySizeAdjustment: sizeAdjAmt,
      selectedServices,
      totalServicePrice:      selectedServices.reduce((s, x) => s + x.price, 0),
      estimatedTotal:         total,
    };

    this.pricingBreakdown.set(breakdown);
    this.productPricingBreakdown.set(null);
    this.estimatedPrice.set(total);
  }

  private updateProductEstimate(pricing: PricingConfig): void {
    const details        = this.bookingDetails.getRawValue() as Record<string, unknown>;
    const deliverableVal = (details['deliverables'] as string) || '';
    const categoryVal    = (details['productType']  as string) || '';

    const tier   = pricing.deliverableTiers?.find(t => t.value === deliverableVal);
    const catAdj = pricing.categoryAdjustments?.find(a => a.value === categoryVal);

    const deliverablePrice  = tier?.price            ?? 0;
    const categoryAdjAmount = catAdj?.priceAdjustment ?? 0;
    const total             = deliverablePrice + categoryAdjAmount;

    const breakdown: ProductPricingBreakdown = {
      deliverableLabel:   tier?.label   ?? null,
      deliverablePrice,
      categoryLabel:      catAdj?.label ?? null,
      categoryAdjustment: categoryAdjAmount,
      estimatedTotal:     total,
    };

    this.productPricingBreakdown.set(breakdown);
    this.pricingBreakdown.set(null);
    this.estimatedPrice.set(total > 0 ? total : null);
  }

  // ── Submit ──────────────────────────────────────────────

  private toLocalISO(dateStr: string, timeStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm]  = timeStr.split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh ?? 0, mm ?? 0, 0, 0).toISOString();
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.bookingDetails.markAllAsTouched();
    if (this.form.invalid || this.bookingDetails.invalid || this.submitting()) return;

    if (!this.selectedSlot()) {
      this.err.set('Please select a date and time by clicking "Select Date & Time".');
      return;
    }

    // Real Estate: at least one service required
    if (this.isRealEstate) {
      const services = (this.bookingDetails.get('services')?.value as string[]) || [];
      if (services.length === 0) {
        this.err.set('Please select at least one service for Real Estate Photography.');
        return;
      }
    }

    this.submitting.set(true);
    this.err.set(null);

    const v        = this.form.getRawValue();
    const slot     = this.selectedSlot()!;
    const iso      = this.toLocalISO(slot.date, slot.time);
    const duration = slot.durationMinutes;

    const rawDetails    = this.bookingDetails.getRawValue() as Record<string, unknown>;
    const cleanDetails: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rawDetails)) {
      if (val === '' || (Array.isArray(val) && val.length === 0)) continue;
      cleanDetails[k] = val;
    }
    // Include pricing snapshot for auditing (backend will recalculate and overwrite total)
    const breakdown = this.pricingBreakdown();
    if (breakdown) {
      cleanDetails['pricingSnapshot'] = breakdown;
    }

    const payload = {
      name:                   v.name,
      email:                  v.email,
      phone:                  v.phone.trim() || undefined,
      type:                   v.type,
      location:               v.location,
      preferredContactMethod: v.preferredContactMethod || undefined,
      estimatedPrice:         this.estimatedPrice() ?? undefined,
      date:                   iso,
      durationMinutes:        duration,
      message:                v.message || undefined,
      bookingDetails:         Object.keys(cleanDetails).length > 0 ? cleanDetails : undefined,
    };

    this.api.create(payload).subscribe({
      next: (created: Booking) => {
        this.submitting.set(false);
        const when = created.date ? formatBookingDate(created.date) : formatBookingDate(iso);
        this.success.set({
          when,
          duration: created.durationMinutes ?? duration,
          email:    v.email,
          location: v.location,
          type:     v.type,
        });
        this.submitted.set(true);
        this.form.reset({
          name: '', email: '', phone: '', type: this.defaultType,
          location: '', preferredContactMethod: '',
          durationMinutes: 60, message: '',
        });
        this.selectedSlot.set(null);
        this.pricingConfig.set(null);
        this.pricingBreakdown.set(null);
        this.productPricingBreakdown.set(null);
        this.rebuildDetailsGroup(this.defaultType);
        this.updateEstimate();
      },
      error: (e) => {
        this.submitting.set(false);
        this.err.set(
          e?.status === 409
            ? 'This time slot is already booked. Please choose another time.'
            : e?.status === 0
              ? 'Unable to connect to the server. Please check your connection.'
              : e?.error?.message || 'Failed to submit booking. Please try again.',
        );
      },
    });
  }
}
