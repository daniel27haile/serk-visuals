const { Schema, model } = require("mongoose");

const TestimonialSchema = new Schema(
  {
    author: { type: String, required: true }, // e.g. "Jane D."
    role: { type: String, default: "" }, // e.g. "Bride", "Brand Manager"
    quote: { type: String, required: true }, // the testimonial text
    avatar: { type: String }, // "/uploads/testimonials/xxx.jpg"
    published: { type: Boolean, default: true }, // hide/show
    order: { type: Number, default: 0 }, // sort order for landing slider
  },
  { timestamps: true }
);

module.exports = model("Testimonial", TestimonialSchema);
