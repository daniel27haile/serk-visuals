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
    url: { type: String, required: true }, // e.g. /uploads/gallery/xxx.jpg
    thumbnail: { type: String }, // optional
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("GalleryItem", GalleryItemSchema);
module.exports.PLACEMENTS = PLACEMENTS;
