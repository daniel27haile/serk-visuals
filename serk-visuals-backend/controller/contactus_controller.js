// controllers/contact-us.controller.js
const mongoose = require("mongoose");
const ContactUs = require("../models/contact-us_model");
const {
  createContactSchema,
  updateContactSchema,
  updateStatusSchema,
} = require("../config/contact-us_validation");


/** Create */
exports.create = async (req, res, next) => {
  try {
    const result = createContactSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: result.error.errors });
    }
    const data = result.data;

    const doc = await ContactUs.create({
      ...data,
      meta: {
        ip: req.ip,
        userAgent: req.get("user-agent") || "",
        referrer: req.get("referer") || "",
      },
    });

    res
      .status(201)
      .location(`/api/contact/${doc._id}`)
      .json({ id: doc._id, message: "Success", data: doc });
  } catch (err) {
    next(err);
  }
};

/** Get One */
exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const doc = await ContactUs.findOne({ _id: id, deletedAt: null });
    if (!doc)
      return res.status(404).json({ message: "Contact message not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

/** List (pagination + search + filter + exclude soft-deleted) */
exports.getAll = async (req, res, next) => {
  try {
    const rawPage = parseInt(req.query.page, 10);
    const rawPageSize = parseInt(req.query.pageSize, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0 && rawPageSize <= 100
        ? rawPageSize
        : 10;

    const { status, q } = req.query;

    const filter = { deletedAt: null };
    if (status) filter.status = status;
    if (q) {
      const rx = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { fullName: rx },
        { email: rx },
        { subject: rx },
        { message: rx },
      ];
    }

    const total = await ContactUs.countDocuments(filter);
    const items = await ContactUs.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      items,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
};

/** Update selected fields (modify) */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const result = updateContactSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: result.error.errors });
    }
    const updates = result.data;

    const doc = await ContactUs.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );
    if (!doc)
      return res.status(404).json({ message: "Contact message not found" });

    res.json({ message: "Updated", data: doc });
  } catch (err) {
    next(err);
  }
};

/** Update only status (quick action) */
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const result = updateStatusSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: result.error.errors });
    }

    const doc = await ContactUs.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { status: result.data.status },
      { new: true, runValidators: true }
    );
    if (!doc)
      return res.status(404).json({ message: "Contact message not found" });

    res.json({ message: "Status updated", data: doc });
  } catch (err) {
    next(err);
  }
};

/** Soft delete */
exports.softDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const doc = await ContactUs.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!doc)
      return res
        .status(404)
        .json({ message: "Contact message not found or already deleted" });

    res.json({ message: "Deleted", id: doc._id });
  } catch (err) {
    next(err);
  }
};

/** Hard delete (admin-only; optional) */
exports.hardDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const doc = await ContactUs.findByIdAndDelete(id);
    if (!doc)
      return res.status(404).json({ message: "Contact message not found" });

    res.json({ message: "Permanently removed", id: doc._id });
  } catch (err) {
    next(err);
  }
};
