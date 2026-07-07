// models/pricing_config_model.js
const { Schema, model } = require("mongoose");

const AdjustmentSchema = new Schema(
  {
    value:           { type: String, required: true },
    label:           { type: String, required: true },
    priceAdjustment: { type: Number, default: 0 },
  },
  { _id: false }
);

const AddOnSchema = new Schema(
  {
    value:    { type: String, required: true },
    label:    { type: String, required: true },
    price:    { type: Number, default: 0 },
    included: { type: Boolean, default: false }, // if true → show "Included", not +$0
  },
  { _id: false }
);

// Used by Product Photography — tier IS the primary price (not an adjustment)
const DeliverableTierSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const PricingConfigSchema = new Schema(
  {
    sessionType:              { type: String, required: true, unique: true, trim: true },
    basePrice:                { type: Number, default: 0 },
    // Real Estate
    propertyTypeAdjustments:  [AdjustmentSchema],
    propertySizeAdjustments:  [AdjustmentSchema],
    serviceAddOns:            [AddOnSchema],
    // Product Photography
    categoryAdjustments:      [AdjustmentSchema],
    deliverableTiers:         [DeliverableTierSchema],
    isActive:                 { type: Boolean, default: true },
    sortOrder:                { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model("PricingConfig", PricingConfigSchema);
