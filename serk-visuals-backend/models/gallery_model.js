const { Schema, model } = require("mongoose");

const GalleryItemSchema = new Schema(
  {
    title: { type: String, required: true },
    album: {
      type: String,
      enum: ["Wedding", "Event", "Birthday", "Product", "Personal", "Other"],
      required: true,
    },
    url: { type: String, required: true }, // e.g. /uploads/gallery/xxx.jpg
    thumbnail: { type: String }, // optional
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("GalleryItem", GalleryItemSchema);
