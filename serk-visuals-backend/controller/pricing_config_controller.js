// controller/pricing_config_controller.js
const PricingConfig = require("../models/pricing_config_model");

// Safe defaults — used when no config has been saved yet.
// Admin can override via PUT /api/admin/pricing-config/:sessionType.
const DEFAULTS = {
  "Real Estate": {
    sessionType: "Real Estate",
    basePrice: 250,
    propertyTypeAdjustments: [
      { value: "House",            label: "House",            priceAdjustment: 0   },
      { value: "Condo",            label: "Condo",            priceAdjustment: 0   },
      { value: "Apartment",        label: "Apartment",        priceAdjustment: 0   },
      { value: "Townhouse",        label: "Townhouse",        priceAdjustment: 0   },
      { value: "Commercial Space", label: "Commercial Space", priceAdjustment: 150 },
      { value: "Other",            label: "Other",            priceAdjustment: 0   },
    ],
    propertySizeAdjustments: [
      { value: "Studio",        label: "Studio",         priceAdjustment: 0   },
      { value: "1 Bedroom",     label: "1 Bedroom",      priceAdjustment: 0   },
      { value: "2 Bedrooms",    label: "2 Bedrooms",     priceAdjustment: 25  },
      { value: "3 Bedrooms",    label: "3 Bedrooms",     priceAdjustment: 50  },
      { value: "4+ Bedrooms",   label: "4+ Bedrooms",    priceAdjustment: 100 },
      { value: "5,000+ sq ft",  label: "5,000+ sq ft",  priceAdjustment: 200 },
    ],
    serviceAddOns: [
      { value: "Interior Photography", label: "Interior Photography", price: 0,   included: true  },
      { value: "Exterior Photography", label: "Exterior Photography", price: 0,   included: true  },
      { value: "Drone Footage",        label: "Drone Photography",    price: 150, included: false },
      { value: "Twilight Shoot",       label: "Twilight Shoot",       price: 125, included: false },
      { value: "Walkthrough Video",    label: "Walkthrough Video",    price: 200, included: false },
      { value: "Floor Plan",           label: "Floor Plan",           price: 100, included: false },
      { value: "Virtual Tour",         label: "Virtual Tour",         price: 175, included: false },
    ],
    isActive: true,
    sortOrder: 0,
  },

  "Wedding": {
    sessionType: "Wedding",
    basePrice: 0,
    packages: [
      { value: "Ceremony Only",        label: "Ceremony Only",        price: 400,  durationMinutes: 120, isActive: true },
      { value: "Half Day",             label: "Half Day (4 hrs)",     price: 700,  durationMinutes: 240, isActive: true },
      { value: "Full Day",             label: "Full Day (8 hrs)",     price: 1200, durationMinutes: 480, isActive: true },
      { value: "Full Wedding Package", label: "Full Wedding Package",  price: 2000, durationMinutes: 600, isActive: true },
    ],
    isActive: true,
    sortOrder: 2,
  },

  "Product": {
    sessionType: "Product",
    basePrice: 0,
    categoryAdjustments: [
      { value: "Food & Beverage",        label: "Food & Beverage",        priceAdjustment: 0   },
      { value: "Clothing & Accessories", label: "Clothing & Accessories", priceAdjustment: 50  },
      { value: "Electronics",            label: "Electronics",            priceAdjustment: 75  },
      { value: "Cosmetics",              label: "Cosmetics",              priceAdjustment: 0   },
      { value: "Jewelry",                label: "Jewelry",                priceAdjustment: 100 },
      { value: "Other",                  label: "Other",                  priceAdjustment: 0   },
    ],
    deliverableTiers: [
      { value: "5–10 images",  label: "5–10 images",  price: 300  },
      { value: "15–25 images", label: "15–25 images", price: 550  },
      { value: "30–50 images", label: "30–50 images", price: 800  },
      { value: "50+ images",   label: "50+ images",   price: 1100 },
    ],
    isActive: true,
    sortOrder: 1,
  },
};

/** Public: GET /api/pricing-config/:sessionType */
async function getConfig(req, res) {
  try {
    const { sessionType } = req.params;
    const config = await PricingConfig.findOne({ sessionType }).lean();
    if (config) return res.json(config);
    if (DEFAULTS[sessionType]) return res.json(DEFAULTS[sessionType]);
    return res.status(404).json({ message: "No pricing config for this session type." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/** Admin: PUT /api/admin/pricing-config/:sessionType */
async function updateConfig(req, res) {
  try {
    const { sessionType } = req.params;
    const {
      basePrice,
      propertyTypeAdjustments,
      propertySizeAdjustments,
      serviceAddOns,
      categoryAdjustments,
      deliverableTiers,
      packages,
      isActive,
      sortOrder,
    } = req.body;

    const update = { sessionType, isActive, sortOrder };
    if (basePrice !== undefined)               update.basePrice               = basePrice;
    if (propertyTypeAdjustments !== undefined) update.propertyTypeAdjustments = propertyTypeAdjustments;
    if (propertySizeAdjustments !== undefined) update.propertySizeAdjustments = propertySizeAdjustments;
    if (serviceAddOns            !== undefined) update.serviceAddOns           = serviceAddOns;
    if (categoryAdjustments      !== undefined) update.categoryAdjustments     = categoryAdjustments;
    if (deliverableTiers         !== undefined) update.deliverableTiers        = deliverableTiers;
    if (packages                 !== undefined) update.packages                = packages;

    const doc = await PricingConfig.findOneAndUpdate(
      { sessionType },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

/** Admin: GET /api/admin/pricing-config */
async function getAllConfigs(req, res) {
  try {
    const configs = await PricingConfig.find().sort({ sortOrder: 1, sessionType: 1 }).lean();
    res.json(configs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/**
 * Recalculates the total price for a Real Estate booking from the current config.
 * Called by the booking controller on every create request.
 * Returns { total, snapshot } or null if type is not config-driven.
 */
async function recalculatePrice(type, bookingDetails) {
  if (type !== "Real Estate" && type !== "Product" && type !== "Wedding") return null;

  if (type === "Wedding") {
    let config = await PricingConfig.findOne({ sessionType: "Wedding" }).lean();
    if (!config) config = DEFAULTS["Wedding"];
    if (!config) return null;

    const details  = bookingDetails || {};
    const pkgValue = details.weddingPackage || null;
    const pkg      = (config.packages || []).find(
      (p) => p.value === pkgValue && p.isActive !== false
    );
    const total    = pkg?.price ?? 0;
    const snapshot = {
      packageLabel: pkg?.label ?? null,
      packagePrice: total,
      durationMinutes: pkg?.durationMinutes ?? null,
      estimatedTotal:  total,
    };
    return { total, snapshot };
  }

  if (type === "Product") {
    let config = await PricingConfig.findOne({ sessionType: "Product" }).lean();
    if (!config) config = DEFAULTS["Product"];
    if (!config) return null;

    const details        = bookingDetails || {};
    const deliverableVal = details.deliverables || null;
    const categoryVal    = details.productType  || null;

    const tier    = config.deliverableTiers?.find(t => t.value === deliverableVal);
    const catAdj  = config.categoryAdjustments?.find(a => a.value === categoryVal);

    const deliverablePrice  = tier?.price           ?? 0;
    const categoryAdjAmount = catAdj?.priceAdjustment ?? 0;
    const total             = deliverablePrice + categoryAdjAmount;

    const snapshot = {
      deliverableLabel:   tier?.label   ?? null,
      deliverablePrice,
      categoryLabel:      catAdj?.label ?? null,
      categoryAdjustment: categoryAdjAmount,
      estimatedTotal:     total,
    };

    return { total, snapshot };
  }

  // Real Estate

  let config = await PricingConfig.findOne({ sessionType: type }).lean();
  if (!config) config = DEFAULTS[type];
  if (!config) return null;

  const details       = bookingDetails || {};
  const propertyType  = details.propertyType  || null;
  const propertySize  = details.propertySize  || null;
  const services      = Array.isArray(details.services) ? details.services : [];

  let total = config.basePrice || 0;

  const typeAdj     = config.propertyTypeAdjustments?.find(a => a.value === propertyType);
  const typeAdjAmt  = typeAdj?.priceAdjustment ?? 0;
  total += typeAdjAmt;

  const sizeAdj     = config.propertySizeAdjustments?.find(a => a.value === propertySize);
  const sizeAdjAmt  = sizeAdj?.priceAdjustment ?? 0;
  total += sizeAdjAmt;

  const serviceBreakdown = [];
  for (const svc of services) {
    const addOn = config.serviceAddOns?.find(a => a.value === svc);
    if (addOn) {
      const price = addOn.included ? 0 : (addOn.price || 0);
      total += price;
      serviceBreakdown.push({ label: addOn.label, price, included: addOn.included });
    }
  }

  const snapshot = {
    basePrice:              config.basePrice,
    propertyTypeLabel:      typeAdj?.label        ?? null,
    propertyTypeAdjustment: typeAdjAmt,
    propertySizeLabel:      sizeAdj?.label        ?? null,
    propertySizeAdjustment: sizeAdjAmt,
    selectedServices:       serviceBreakdown,
    totalServicePrice:      serviceBreakdown.reduce((s, x) => s + x.price, 0),
    estimatedTotal:         total,
  };

  return { total, snapshot };
}

module.exports = { getConfig, updateConfig, getAllConfigs, recalculatePrice, DEFAULTS };
