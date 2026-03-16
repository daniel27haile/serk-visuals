const { Schema, model } = require("mongoose");

const TestimonialSchema = new Schema(
  {
    author: { type: String, required: true },
    role: { type: String, default: "" },
    quote: { type: String, required: true },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model("Testimonial", TestimonialSchema);
