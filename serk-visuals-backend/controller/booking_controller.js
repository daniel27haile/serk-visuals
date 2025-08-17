const Booking = require("../models/booking_model");

const ALLOWED_TYPES = ["wedding", "event", "portrait", "product", "video"];
const ALLOWED_STATUS = ["new", "confirmed", "completed", "cancelled"];

const pick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

exports.list = async (req, res) => {
  try {
    const { status, type, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ALLOWED_STATUS.includes(status)) filter.status = status;
    if (type && ALLOWED_TYPES.includes(type)) filter.type = type;
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ name: rx }, { email: rx }, { message: rx }];
    }

    const perPage = Math.max(1, Number(limit));
    const skip = (Math.max(1, Number(page)) - 1) * perPage;

    const [items, total] = await Promise.all([
      Booking.find(filter).sort("-createdAt").skip(skip).limit(perPage),
      Booking.countDocuments(filter),
    ]);
    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / perPage),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await Booking.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = pick(req.body, [
      "name",
      "email",
      "phone",
      "type",
      "date",
      "message",
      "status",
    ]);

    // Validate enums
    if (data.type && !ALLOWED_TYPES.includes(data.type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    if (data.status && !ALLOWED_STATUS.includes(data.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Normalize date
    if (data.date) {
      const d = new Date(data.date);
      if (isNaN(d.getTime()))
        return res.status(400).json({ message: "Invalid date" });
      data.date = d;
    }

    const doc = await Booking.create(data);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = pick(req.body, [
      "name",
      "email",
      "phone",
      "type",
      "date",
      "message",
      "status",
    ]);

    if (data.type && !ALLOWED_TYPES.includes(data.type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    if (data.status && !ALLOWED_STATUS.includes(data.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (data.date) {
      const d = new Date(data.date);
      if (isNaN(d.getTime()))
        return res.status(400).json({ message: "Invalid date" });
      data.date = d;
    }

    const doc = await Booking.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const doc = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const doc = await Booking.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
