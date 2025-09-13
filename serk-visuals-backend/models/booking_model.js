// models/booking_model.js
const { Schema, model } = require("mongoose");

// NOTE: phone stays Number to match your frontend typing.
// Consider switching to String later to preserve leading zeros and intl formats.

const BookingSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: Number,

    type: {
      type: String,
      enum: ["Wedding", "Event", "Birthday", "Product", "Personal", "Other"],
    },

    // Start datetime (UTC in DB). You already send ISO from the client.
    date: { type: Date, required: true, index: true },

    // NEW: duration & end for conflict checks
    durationMinutes: { type: Number, default: 60, min: 15, max: 24 * 60 },
    end: { type: Date, required: true, index: true },

    message: String,

    status: {
      type: String,
      enum: ["new", "confirmed", "completed", "cancelled"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

// Helpful indexes for range queries
BookingSchema.index({ date: 1, end: 1, status: 1 });

module.exports = model("Booking", BookingSchema);
