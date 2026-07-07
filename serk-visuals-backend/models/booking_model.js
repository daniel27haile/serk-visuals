// models/booking_model.js
const { Schema, model } = require("mongoose");

const ALLOWED_TYPES = [
  // New session types
  "Portrait", "Family", "Wedding", "Event", "Graduation",
  "Real Estate", "Commercial", "Engagement",
  // Legacy types kept for backward compatibility
  "Birthday", "Product", "Personal", "Other",
];

const BookingSchema = new Schema(
  {
    name:  { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    // Changed from Number to String to handle formatted/intl phone numbers.
    // Existing Number values in MongoDB are silently cast to String by Mongoose.
    phone: { type: String, trim: true },

    // Session / service type
    type: {
      type: String,
      enum: ALLOWED_TYPES,
    },

    // Shoot location (venue, address, or description)
    location: { type: String, trim: true },

    // Group size
    numberOfPeople: {
      type: String,
      enum: ["1", "2-5", "5-10", "10+", ""],
      default: "",
    },

    // How the client prefers to be reached
    preferredContactMethod: {
      type: String,
      enum: ["Email", "Phone", "Text Message", ""],
      default: "",
    },

    // Start datetime (UTC in DB). ISO string sent from the client.
    date: { type: Date, required: true, index: true },

    // Duration and end for conflict checks
    durationMinutes: { type: Number, default: 60, min: 15, max: 24 * 60 },
    end:             { type: Date, required: true, index: true },

    // Client-side estimated price (informational only)
    estimatedPrice: { type: Number },

    // Session-type-specific fields (group size, package, services, etc.)
    bookingDetails: { type: Schema.Types.Mixed },

    message: String,

    status: {
      type: String,
      enum: ["pending", "new", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for fast range + status queries
BookingSchema.index({ date: 1, end: 1, status: 1 });

module.exports = model("Booking", BookingSchema);
