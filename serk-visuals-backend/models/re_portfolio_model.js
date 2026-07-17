// models/re_portfolio_model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const REImageSchema = new Schema(
  {
    imageKey: { type: String, required: true },
    thumbKey:  { type: String, default: null },
    url:       { type: String },       // derived from imageKey via CDN
    thumbnail: { type: String },       // derived from thumbKey via CDN
    alt:       { type: String, default: '' },
    order:     { type: Number, default: 0 },
  },
  { _id: true }
);

const REPortfolioSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    coverImageKey:  { type: String, required: true },
    coverUrl:       { type: String },       // derived
    coverThumbKey:  { type: String, default: null },
    coverThumbUrl:  { type: String },       // derived
    images:         { type: [REImageSchema], default: [] },
    propertyType: {
      type: String,
      enum: ['Residential', 'Luxury', 'Condo', 'Townhome', 'Commercial', 'Vacant Land', 'Other'],
      default: 'Residential',
    },
    location:    { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    featured:    { type: Boolean, default: false },
    published:   { type: Boolean, default: false },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

REPortfolioSchema.index({ published: 1, order: 1, createdAt: -1 });
REPortfolioSchema.index({ featured: 1, published: 1 });

module.exports = mongoose.model('REPortfolio', REPortfolioSchema);
