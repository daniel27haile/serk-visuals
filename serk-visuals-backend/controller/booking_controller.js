// controller/booking_controller.js
const Booking = require("../models/booking_model");
const { sendMail } = require("../utils/mailer");
const {
  customerConfirmation,
  adminNotification,
} = require("../utils/email-templates");

const { ADMIN_EMAIL } = process.env;

const ALLOWED_TYPES = [
  "wedding",
  "event",
  "portrait",
  "product",
  "video",
  "birthday",
  "personal",
  "other",
];
const ALLOWED_STATUS = ["new", "confirmed", "completed", "cancelled"];

const pick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

function combineDateAndTime(dateStr, timeStr) {
  // If already full ISO, accept as-is
  const maybe = new Date(dateStr);
  if (!isNaN(maybe.getTime()) && String(dateStr).includes("T")) return maybe;

  const [y, m, d] = String(dateStr).split("-").map(Number);
  let hh = 0,
    mm = 0;
  if (timeStr) {
    const [H, M] = String(timeStr).split(":").map(Number);
    hh = H || 0;
    mm = M || 0;
  }
  // Local time (server will store Date as UTC internally)
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
}

async function getStats(_req, res) {
  const now = new Date();
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [total, pending, upcoming] = await Promise.all([
    Booking.estimatedDocumentCount(),
    Booking.countDocuments({ status: { $in: ["new", "confirmed"] } }),
    Booking.countDocuments({
      date: { $gte: now, $lte: in30 },
      status: { $ne: "cancelled" },
    }),
  ]);
  res.json({ total, pending, upcoming });
}

async function getAll(req, res) {
  try {
    const {
      q,
      status,
      type,
      from,
      to,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (status && ALLOWED_STATUS.includes(status)) filter.status = status;
    if (type && ALLOWED_TYPES.includes(type)) filter.type = type;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ name: rx }, { email: rx }, { message: rx }];
    }

    const perPage = Math.max(1, Number(limit));
    const skip = (Math.max(1, Number(page)) - 1) * perPage;

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .sort(String(sort || "-createdAt"))
        .skip(skip)
        .limit(perPage),
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
}

async function getOne(req, res) {
  try {
    const doc = await Booking.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function create(req, res) {
  try {
    const data = pick(req.body, [
      "name",
      "email",
      "phone",
      "type",
      "date",
      "time",
      "message",
      "status",
    ]);

    if (data.type && !ALLOWED_TYPES.includes(data.type))
      return res.status(400).json({ message: "Invalid type" });
    if (data.status && !ALLOWED_STATUS.includes(data.status))
      return res.status(400).json({ message: "Invalid status" });

    if (data.date) {
      const dt = combineDateAndTime(data.date, data.time);
      if (isNaN(dt.getTime()))
        return res.status(400).json({ message: "Invalid date/time" });
      data.date = dt;
      delete data.time;
    }

    const doc = await Booking.create(data);

    // Fire-and-forget emails
    (async () => {
      try {
        // Admin email
        if (ADMIN_EMAIL) {
          const msg = adminNotification(doc.toObject());
          await sendMail({
            to: ADMIN_EMAIL,
            subject: msg.subject,
            text: msg.text,
            html: msg.html,
            replyTo: doc.email || undefined,
          });
        }
        // Customer email
        if (doc.email) {
          const msg = customerConfirmation(doc.toObject());
          await sendMail({
            to: doc.email,
            subject: msg.subject,
            text: msg.text,
            html: msg.html,
          });
        }
      } catch (mailErr) {
        console.error("Email send error:", mailErr);
      }
    })();

    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function update(req, res) {
  try {
    const data = pick(req.body, [
      "name",
      "email",
      "phone",
      "type",
      "date",
      "time",
      "message",
      "status",
    ]);

    if (data.type && !ALLOWED_TYPES.includes(data.type))
      return res.status(400).json({ message: "Invalid type" });
    if (data.status && !ALLOWED_STATUS.includes(data.status))
      return res.status(400).json({ message: "Invalid status" });

    if (data.date) {
      const dt = combineDateAndTime(data.date, data.time);
      if (isNaN(dt.getTime()))
        return res.status(400).json({ message: "Invalid date/time" });
      data.date = dt;
      delete data.time;
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
}

async function setStatus(req, res) {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const doc = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Booking not found" });

    // Optional: notify customer of status update
    (async () => {
      try {
        if (doc.email) {
          await sendMail({
            to: doc.email,
            subject: `Your booking is ${status}`,
            text: `Hi ${doc.name || ""}, your booking is now ${status}.`,
            html: `<p>Hi ${
              doc.name || ""
            }, your booking is now <strong>${status}</strong>.</p>`,
          });
        }
      } catch (err) {
        console.error("Email send error:", err);
      }
    })();

    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function bulkStatus(req, res) {
  const { ids = [], status } = req.body || {};
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ message: "ids required" });
  if (!ALLOWED_STATUS.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const r = await Booking.updateMany(
    { _id: { $in: ids } },
    { $set: { status } }
  );
  res.json({
    matched: r.matchedCount ?? r.n,
    modified: r.modifiedCount ?? r.nModified,
    status,
  });
}

async function bulkDelete(req, res) {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ message: "ids required" });

  const r = await Booking.deleteMany({ _id: { $in: ids } });
  res.json({ deleted: r.deletedCount });
}

async function remove(req, res) {
  try {
    const doc = await Booking.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function exportCsv(req, res) {
  const { q, status, type, from, to } = req.query;

  const filter = {};
  if (status && ALLOWED_STATUS.includes(status)) filter.status = status;
  if (type && ALLOWED_TYPES.includes(type)) filter.type = type;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (q) {
    const rx = new RegExp(q, "i");
    filter.$or = [{ name: rx }, { email: rx }, { message: rx }];
  }

  const rows = await Booking.find(filter).sort("-createdAt").lean();

  const header = "name,email,phone,type,status,date,createdAt\n";
  const body = rows
    .map((r) =>
      [
        r.name,
        r.email,
        r.phone ?? "",
        r.type ?? "",
        r.status ?? "",
        r.date?.toISOString() ?? "",
        r.createdAt?.toISOString() ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="bookings.csv"');
  res.send(header + body);
}

module.exports = {
  getStats,
  getAll,
  getOne,
  create,
  update,
  setStatus,
  bulkStatus,
  bulkDelete,
  remove,
  exportCsv,
};
