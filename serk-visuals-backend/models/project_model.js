// models/project_model.js
const { Schema, model } = require("mongoose");

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ["new", "in-progress", "completed", "delivered"],
      default: "new",
      index: true,
    },
    // file paths (served from /uploads)
    cover: { type: String, required: true }, // e.g. /uploads/projects/xxxx.jpg
    thumbnail: { type: String, default: null }, // e.g. /uploads/projects/thumb-xxxx.jpg
    tags: { type: [String], default: [] },
    notes: { type: String, trim: true, maxlength: 2000 },

    // Soft delete
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true, // createdAt / updatedAt
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        return {
          id: ret._id,
          title: ret.title,
          status: ret.status,
          cover: ret.cover,
          thumbnail: ret.thumbnail ?? null,
          tags: ret.tags ?? [],
          notes: ret.notes ?? null,
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      },
    },
  }
);

// Helpful indexes
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ status: 1, createdAt: -1 });

module.exports = model("Project", ProjectSchema);
