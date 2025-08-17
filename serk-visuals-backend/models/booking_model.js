const { Schema, model } = require("mongoose");

// Define the Booking schema
// This schema will be used to create a Booking model


const BookingSchema = new Schema(
  {
    name: String,
    email: String,
    phone: String,
    type: {
      type: String,
      enum: ["wedding", "event", "portrait", "product", "video"],
    },
    date: Date,
    message: String,
    status: {
      type: String,
      enum: ["new", "confirmed", "completed", "cancelled"],
      default: "new",
    },
  },
  { timestamps: true }
);
module.exports = model("Booking", BookingSchema);
