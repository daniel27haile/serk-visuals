// controller/project_controller.js
const Project = require("../models/project_model");

const pick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

/** LIST: GET /api/projects */
exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(req.query.pageSize) || 10)
    );
    const { q, status } = req.query;
    const year = Number(req.query.year) || undefined;
    const month = Number(req.query.month) || undefined;

    const filter = { deletedAt: null };
    if (status) filter.status = status;

    if (q) {
      const rx = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [{ title: rx }, { tags: rx }, { notes: rx }];
    }

    if (year || month) {
      const start = new Date(year || 1970, month ? month - 1 : 0, 1);
      const end = month
        ? new Date(start.getFullYear(), start.getMonth() + 1, 1)
        : new Date((year || 3000) + 1, 0, 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const [items, total] = await Promise.all([
      Project.find(filter)
        .sort("-createdAt")
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
};

/** GET ONE */
exports.getOne = async (req, res, next) => {
  try {
    const doc = await Project.findOne({
      _id: req.params.id,
      deletedAt: null,
    }).lean();
    if (!doc) return res.status(404).json({ message: "Project not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE (JSON)
 * body: { title, status?, tags?, notes?, createdAt? }
 */
exports.create = async (req, res, next) => {
  try {
    const body = pick(req.body, [
      "title",
      "status",
      "tags",
      "notes",
      "createdAt",
    ]);
    if (!body.title) {
      return res.status(400).json({ message: "title is required" });
    }

    const tags =
      typeof body.tags === "string"
        ? body.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(body.tags)
        ? body.tags
        : [];

    const doc = await Project.create({
      title: body.title,
      status: body.status || "new",
      tags,
      notes: body.notes || undefined,
      ...(body.createdAt ? { createdAt: new Date(body.createdAt) } : {}),
    });

    res.status(201).json(doc.toObject());
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE (JSON)
 * body: { title?, status?, tags?, notes?, createdAt? }
 */
exports.update = async (req, res, next) => {
  try {
    const body = pick(req.body, [
      "title",
      "status",
      "tags",
      "notes",
      "createdAt",
    ]);
    const patch = {};

    if (typeof body.title !== "undefined") patch.title = body.title;
    if (typeof body.status !== "undefined") patch.status = body.status;
    if (typeof body.notes !== "undefined") patch.notes = body.notes;

    if (typeof body.tags !== "undefined") {
      patch.tags =
        typeof body.tags === "string"
          ? body.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : Array.isArray(body.tags)
          ? body.tags
          : [];
    }
    if (body.createdAt) patch.createdAt = new Date(body.createdAt);

    const doc = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      patch,
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Project not found" });

    res.json(doc);
  } catch (err) {
    next(err);
  }
};

/** UPDATE STATUS (quick) */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["new", "in-progress", "completed", "delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const doc = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { status },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Project not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

/** SOFT DELETE */
exports.softDelete = async (req, res, next) => {
  try {
    const doc = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!doc)
      return res
        .status(404)
        .json({ message: "Project not found or already deleted" });
    res.json({ message: "Deleted", id: doc._id });
  } catch (err) {
    next(err);
  }
};

/** HARD DELETE */
exports.hardDelete = async (req, res, next) => {
  try {
    const doc = await Project.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Permanently removed", id: doc._id });
  } catch (err) {
    next(err);
  }
};
