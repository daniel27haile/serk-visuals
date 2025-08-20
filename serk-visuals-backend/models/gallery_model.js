const { Schema, model } = require("mongoose");

// keep categories consistent: 'wedding','event','birthday','product','personal'
const GalleryItemSchema = new Schema(
  {
    title: { type: String, required: true },
    album: {
      type: String,
      enum: ["wedding", "event", "birthday", "product", "personal", "other"],
      required: true,
    },
    url: { type: String, required: true }, // served static: /uploads/...
    thumbnail: { type: String }, // optional
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("GalleryItem", GalleryItemSchema);
