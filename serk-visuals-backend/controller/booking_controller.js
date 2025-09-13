// controller/booking_controller.js
const Booking = require("../models/booking_model");
const { sendMail } = require("../utils/mailer");
const {
  customerConfirmation,
  adminNotification,
} = require("../utils/email-templates");

const { ADMIN_EMAIL } = process.env;

const ALLOWED_TYPES = [
  "Wedding",
  "Event",
  "Birthday",
  "Product",
  "Personal",
  "Other",
];
const ALLOWED_STATUS = ["new", "confirmed", "completed", "cancelled"];

const pick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

function combineDateAndTime(dateStr, timeStr) {
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
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
}

/** Overlap check: any booking (not cancelled) whose [date, end) overlaps with [start, end) */
async function findConflict(start, end, excludeId) {
  const q = {
    status: { $ne: "cancelled" },
    date: { $lt: end }, // starts before this slot ends
    end: { $gt: start }, // ends after this slot starts
  };
  if (excludeId) q._id = { $ne: excludeId };
  return Booking.findOne(q)
    .select("_id name email type status date end")
    .lean();
}

/** Stats */
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

/** Availability: GET /api/bookings/availability?date=YYYY-MM-DD|ISO&time=HH:mm&durationMinutes=60 */
async function availability(req, res) {
  try {
    const { date, time, durationMinutes } = req.query;
    const start = combineDateAndTime(date, time);
    if (isNaN(start.getTime()))
      return res.status(400).json({ message: "Invalid date/time" });

    // use nullish coalescing (no mixing with ||)
    const duration = Math.max(
      15,
      Math.min(24 * 60, Number(durationMinutes ?? 60))
    );
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const conflict = await findConflict(start, end);
    res.json({
      available: !conflict,
      conflict: conflict || null,
      start,
      end,
      durationMinutes: duration,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

/** List */
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

/** Read */
async function getOne(req, res) {
  try {
    const doc = await Booking.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

/** Create with conflict prevention */
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
      "durationMinutes",
    ]);

    if (data.type && !ALLOWED_TYPES.includes(data.type))
      return res.status(400).json({ message: "Invalid type" });
    if (data.status && !ALLOWED_STATUS.includes(data.status))
      return res.status(400).json({ message: "Invalid status" });

    // Compute start/end
    const start = combineDateAndTime(data.date, data.time);
    if (isNaN(start.getTime()))
      return res.status(400).json({ message: "Invalid date/time" });
    const duration = Math.max(
      15,
      Math.min(24 * 60, Number(data.durationMinutes ?? 60))
    );
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Conflict check (block any overlapping booking except 'cancelled')
    const conflict = await findConflict(start, end);
    if (conflict) {
      return res.status(409).json({
        message: "This time is already booked.",
        conflict,
        start,
        end,
        durationMinutes: duration,
      });
    }

    const doc = await Booking.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type,
      date: start,
      end,
      durationMinutes: duration,
      message: data.message,
      status: data.status || "new",
    });

    // Fire-and-forget emails
    (async () => {
      try {
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

/** Update with conflict prevention */
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
      "durationMinutes",
    ]);

    if (data.type && !ALLOWED_TYPES.includes(data.type))
      return res.status(400).json({ message: "Invalid type" });
    if (data.status && !ALLOWED_STATUS.includes(data.status))
      return res.status(400).json({ message: "Invalid status" });

    // Build patch and recompute end if date/time/duration provided
    const patch = {
      ...pick(data, ["name", "email", "phone", "type", "message", "status"]),
    };

    let start = null,
      end = null;
    if (
      typeof data.date !== "undefined" ||
      typeof data.time !== "undefined" ||
      typeof data.durationMinutes !== "undefined"
    ) {
      // Need current record to fill missing bits
      const current = await Booking.findById(req.params.id);
      if (!current)
        return res.status(404).json({ message: "Booking not found" });

      const baseStart =
        typeof data.date !== "undefined" || typeof data.time !== "undefined"
          ? combineDateAndTime(
              data.date ?? current.date.toISOString(),
              data.time
            )
          : current.date;

      if (isNaN(baseStart.getTime()))
        return res.status(400).json({ message: "Invalid date/time" });

      // ✅ Use parentheses / nullish-only to avoid mixing ?? and ||
      const dur = Math.max(
        15,
        Math.min(
          24 * 60,
          Number(data.durationMinutes ?? current.durationMinutes ?? 60)
        )
      );

      start = baseStart;
      end = new Date(start.getTime() + dur * 60 * 1000);
      patch.date = start;
      patch.end = end;
      patch.durationMinutes = dur;

      // Only check conflicts if result is an active booking (not cancelled)
      const targetStatus = patch.status ?? current.status;
      if (targetStatus !== "cancelled") {
        const conflict = await findConflict(start, end, current._id);
        if (conflict) {
          return res.status(409).json({
            message: "This time is already booked.",
            conflict,
            start,
            end,
            durationMinutes: dur,
          });
        }
      }
    }

    const doc = await Booking.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });

    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

/** Set status (prevent confirming into an occupied slot) */
async function setStatus(req, res) {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const current = await Booking.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Booking not found" });

    if (status !== "cancelled") {
      const conflict = await findConflict(
        current.date,
        current.end,
        current._id
      );
      if (conflict) {
        return res.status(409).json({
          message: "Cannot set status: slot is already booked.",
          conflict,
          start: current.date,
          end: current.end,
          durationMinutes: current.durationMinutes,
        });
      }
    }

    const doc = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Booking not found" });

    // Notify customer (optional)
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

/** Bulk status / delete stay the same */
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

/** CSV now includes end & duration */
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

  const header =
    "name,email,phone,type,status,start,end,durationMinutes,createdAt\n";
  const body = rows
    .map((r) =>
      [
        r.name,
        r.email,
        r.phone ?? "",
        r.type ?? "",
        r.status ?? "",
        r.date ? new Date(r.date).toISOString() : "",
        r.end ? new Date(r.end).toISOString() : "",
        r.durationMinutes ?? "",
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="bookings.csv"');
  res.send(header + body);
}

module.exports = {
  availability,
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
