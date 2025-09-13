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
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
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
      index: true,
    },
    reply: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    meta: {
      ip: { type: String, default: null },
      userAgent: { type: String, default: null },
      referrer: { type: String, default: null },
    },
    // optional soft-delete
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        return {
          id: ret._id,
          fullName: ret.fullName,
          email: ret.email,
          subject: ret.subject,
          message: ret.message,
          status: ret.status,
          reply: ret.reply ?? null,
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      },
    },
  }
);

// helpful indexes
ContactUsSchema.index({ createdAt: -1 });
ContactUsSchema.index({ status: 1, createdAt: -1 });

module.exports = model("ContactUs", ContactUsSchema);
