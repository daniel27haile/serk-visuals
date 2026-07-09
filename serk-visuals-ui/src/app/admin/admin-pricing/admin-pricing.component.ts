import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { PricingConfigService } from '../../shared/services/pricing-config.service';
import { PricingConfig, PricingAdjustment, ServiceAddOn, DeliverableTier } from '../../shared/models/pricing-config.model';

type AdminPricingTab = 'Real Estate' | 'Product';

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-pricing.component.html',
  styleUrls: ['./admin-pricing.component.scss'],
})
export class AdminPricingComponent implements OnInit {
  private readonly fb  = inject(FormBuilder);
  private readonly api = inject(PricingConfigService);

  activeTab = signal<AdminPricingTab>('Real Estate');

  // ── Real Estate form ──────────────────────────────────────
  reLoading = signal(true);
  reSaving  = signal(false);
  reError   = signal<string | null>(null);
  reSaved   = signal(false);

  reForm = this.fb.group({
    isActive:                [true],
    basePrice:               [0, [Validators.min(0)]],
    propertyTypeAdjustments: this.fb.array<FormGroup>([]),
    propertySizeAdjustments: this.fb.array<FormGroup>([]),
    serviceAddOns:           this.fb.array<FormGroup>([]),
  });

  // ── Product Photography form ──────────────────────────────
  productLoading = signal(true);
  productSaving  = signal(false);
  productError   = signal<string | null>(null);
  productSaved   = signal(false);

  productForm = this.fb.group({
    categoryAdjustments: this.fb.array<FormGroup>([]),
    deliverableTiers:    this.fb.array<FormGroup>([]),
  });

  ngOnInit(): void {
    this.api.getConfig('Real Estate').subscribe({
      next: cfg => { this.populateReForm(cfg); this.reLoading.set(false); },
      error: () => { this.reError.set('Failed to load Real Estate pricing config.'); this.reLoading.set(false); },
    });

    this.api.getConfig('Product').subscribe({
      next: cfg => { this.populateProductForm(cfg); this.productLoading.set(false); },
      error: () => { this.productError.set('Failed to load Product Photography pricing config.'); this.productLoading.set(false); },
    });
  }

  // ── Form builders ─────────────────────────────────────────

  private adjustmentGroup(a: PricingAdjustment): FormGroup {
    return this.fb.group({ value: [a.value], label: [a.label], priceAdjustment: [a.priceAdjustment] });
  }

  private addOnGroup(a: ServiceAddOn): FormGroup {
    return this.fb.group({ value: [a.value], label: [a.label], price: [a.price], included: [a.included] });
  }

  private tierGroup(t: DeliverableTier): FormGroup {
    return this.fb.group({ value: [t.value], label: [t.label], price: [t.price] });
  }

  get reIsActive(): boolean { return !!this.reForm.get('isActive')?.value; }

  private populateReForm(cfg: PricingConfig): void {
    this.reForm.patchValue({ isActive: cfg.isActive ?? true, basePrice: cfg.basePrice });

    const typeArr = this.reForm.get('propertyTypeAdjustments') as FormArray;
    typeArr.clear();
    (cfg.propertyTypeAdjustments ?? []).forEach(a => typeArr.push(this.adjustmentGroup(a)));

    const sizeArr = this.reForm.get('propertySizeAdjustments') as FormArray;
    sizeArr.clear();
    (cfg.propertySizeAdjustments ?? []).forEach(a => sizeArr.push(this.adjustmentGroup(a)));

    const svcArr = this.reForm.get('serviceAddOns') as FormArray;
    svcArr.clear();
    (cfg.serviceAddOns ?? []).forEach(a => svcArr.push(this.addOnGroup(a)));
  }

  private populateProductForm(cfg: PricingConfig): void {
    const catArr = this.productForm.get('categoryAdjustments') as FormArray;
    catArr.clear();
    (cfg.categoryAdjustments ?? []).forEach(a => catArr.push(this.adjustmentGroup(a)));

    const tierArr = this.productForm.get('deliverableTiers') as FormArray;
    tierArr.clear();
    (cfg.deliverableTiers ?? []).forEach(t => tierArr.push(this.tierGroup(t)));
  }

  // ── Getters ───────────────────────────────────────────────

  get propertyTypeAdjustments(): FormArray { return this.reForm.get('propertyTypeAdjustments') as FormArray; }
  get propertySizeAdjustments(): FormArray { return this.reForm.get('propertySizeAdjustments') as FormArray; }
  get serviceAddOns(): FormArray           { return this.reForm.get('serviceAddOns') as FormArray; }
  get categoryAdjustments(): FormArray     { return this.productForm.get('categoryAdjustments') as FormArray; }
  get deliverableTiers(): FormArray        { return this.productForm.get('deliverableTiers') as FormArray; }

  // ── Save ─────────────────────────────────────────────────

  saveRealEstate(): void {
    if (this.reSaving()) return;
    this.reSaving.set(true);
    this.reError.set(null);
    this.reSaved.set(false);

    const payload = this.reForm.getRawValue() as Partial<PricingConfig>;
    this.api.updateConfig('Real Estate', payload).subscribe({
      next: () => {
        this.reSaving.set(false);
        this.reSaved.set(true);
        setTimeout(() => this.reSaved.set(false), 3000);
      },
      error: () => {
        this.reSaving.set(false);
        this.reError.set('Failed to save. Please try again.');
      },
    });
  }

  saveProduct(): void {
    if (this.productSaving()) return;
    this.productSaving.set(true);
    this.productError.set(null);
    this.productSaved.set(false);

    const payload = this.productForm.getRawValue() as Partial<PricingConfig>;
    this.api.updateConfig('Product', payload).subscribe({
      next: () => {
        this.productSaving.set(false);
        this.productSaved.set(true);
        setTimeout(() => this.productSaved.set(false), 3000);
      },
      error: () => {
        this.productSaving.set(false);
        this.productError.set('Failed to save. Please try again.');
      },
    });
  }

  switchTab(tab: AdminPricingTab): void {
    this.activeTab.set(tab);
  }
}
