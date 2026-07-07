export interface PricingAdjustment {
  value: string;
  label: string;
  priceAdjustment: number;
}

export interface ServiceAddOn {
  value: string;
  label: string;
  price: number;
  included: boolean;
}

export interface DeliverableTier {
  value: string;
  label: string;
  price: number;
}

export interface PricingConfig {
  _id?: string;
  sessionType: string;
  basePrice: number;
  // Real Estate
  propertyTypeAdjustments: PricingAdjustment[];
  propertySizeAdjustments: PricingAdjustment[];
  serviceAddOns: ServiceAddOn[];
  // Product Photography
  categoryAdjustments: PricingAdjustment[];
  deliverableTiers: DeliverableTier[];
  isActive: boolean;
  sortOrder: number;
  updatedAt?: string;
}

export interface PricingBreakdown {
  basePrice: number;
  propertyTypeLabel: string | null;
  propertyTypeAdjustment: number;
  propertySizeLabel: string | null;
  propertySizeAdjustment: number;
  selectedServices: { label: string; price: number; included: boolean }[];
  totalServicePrice: number;
  estimatedTotal: number;
}

export interface ProductPricingBreakdown {
  deliverableLabel: string | null;
  deliverablePrice: number;
  categoryLabel: string | null;
  categoryAdjustment: number;
  estimatedTotal: number;
}
