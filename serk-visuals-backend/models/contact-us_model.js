// models/contact-us.js
const { Schema, model } = require("mongoose");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactUsSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: emailRegex,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["new", "read", "replied"],
      default: "new",
    },
    meta: {
      ip: String,
      userAgent: String,
      referrer: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        // keep only public fields if you ever JSON-stringify docs
        return {
          id: ret._id,
          fullName: ret.fullName,
          email: ret.email,
          subject: ret.subject,
          message: ret.message,
          status: ret.status,
          createdAt: ret.createdAt,
        };
      },
    },
  }
);

module.exports = model("ContactUs", ContactUsSchema);
