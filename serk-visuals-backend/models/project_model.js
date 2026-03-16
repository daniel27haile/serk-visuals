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
    tags: { type: [String], default: [] },
    notes: { type: String, trim: true, maxlength: 2000 },

    // Soft delete
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        return {
          id: ret._id,
          title: ret.title,
          status: ret.status,
          tags: ret.tags ?? [],
          notes: ret.notes ?? null,
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      },
    },
  }
);

ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ status: 1, createdAt: -1 });

module.exports = model("Project", ProjectSchema);
