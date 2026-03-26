const { Schema, model } = require("mongoose");

const PLACEMENTS = ["gallery", "slider", "featured"]; // new

const GalleryItemSchema = new Schema(
  {
    title: { type: String, required: true },
    album: {
      type: String,
      enum: ["Wedding", "Event", "Birthday", "Product", "Personal", "Other"],
      required: true,
    },
    placement: {
      type: String,
      enum: PLACEMENTS,
      default: "gallery", // new
      index: true,
    },
    order: { type: Number, default: 0, index: true }, // new
    url: { type: String, required: true }, // absolute CDN/S3 URL — derived from imageKey
    thumbnail: { type: String }, // optional absolute CDN/S3 URL — derived from thumbKey
    imageKey: { type: String }, // S3 object key — source of truth for URL derivation
    thumbKey: { type: String }, // S3 object key for thumbnail
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound indexes for the exact query patterns used by landing page + gallery page:
// { placement, published } covers all public listing queries.
// The trailing sort fields (order, createdAt) are included so MongoDB can
// satisfy ORDER BY from the index without a separate sort step.
GalleryItemSchema.index({ placement: 1, published: 1, order: 1 });
GalleryItemSchema.index({ placement: 1, published: 1, createdAt: -1 });

module.exports = model("GalleryItem", GalleryItemSchema);
module.exports.PLACEMENTS = PLACEMENTS;
