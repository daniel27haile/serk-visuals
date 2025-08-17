const { Schema, model } = require("mongoose");

// Define the GalleryItem schema
const GalleryItem = new Schema(
  {
    title: String,
    album: {
      type: String,
      enum: ["wedding", "event", "birthday", "product", "personal"],
    },
    url: String, // S3/Cloudinary URL
    thumbnail: String,
    tags: [String],
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);
module.exports = model("GalleryItem", GalleryItem);
