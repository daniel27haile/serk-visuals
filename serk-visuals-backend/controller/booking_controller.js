// controller/booking_controller.js
const Booking = require("../models/booking_model");
const cfg     = require("../config/availability.config");
const { sendMail } = require("../utils/mailer");
const { customerConfirmation, adminNotification } = require("../utils/email-templates");
const { recalculatePrice } = require("./pricing_config_controller");

const NOTIFY_EMAIL = process.env.EMAIL_TO || process.env.ADMIN_EMAIL;

const ALLOWED_TYPES = [
  "Portrait", "Family", "Wedding", "Event", "Graduation",
  "Real Estate", "Commercial", "Engagement",
  "Birthday", "Product", "Personal", "Other",
];
const ALLOWED_STATUS = ["pending", "new", "confirmed", "completed", "cancelled"];
const ALLOWED_PEOPLE = ["1", "2-5", "5-10", "10+", ""];
const ALLOWED_CONTACT = ["Email", "Phone", "Text Message", ""];

const pick = (obj, keys) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([k]) => keys.includes(k)));

// ── Date helpers ─────────────────────────────────────────

function combineDateAndTime(dateStr, timeStr) {
  const maybe = new Date(dateStr);
  if (!isNaN(maybe.getTime()) && String(dateStr).includes("T")) return maybe;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  let hh = 0, mm = 0;
  if (timeStr) {
    const [H, M] = String(timeStr).split(":").map(Number);
    hh = H || 0; mm = M || 0;
  }
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
}

function formatDateStr(d) {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/** Date object → "H:MM AM/PM" */
function formatTimeAmPm(d) {
  const h      = d.getHours();
  const m      = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** "14:30" → "2:30 PM" */
function amPmFromHHMM(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ── Conflict helpers ─────────────────────────────────────

/** Standard overlap: any non-cancelled booking whose [date, end) overlaps [start, end) */
async function findConflict(start, end, excludeId) {
  const q = {
    status: { $nin: ["cancelled"] },
    date:   { $lt: end  },
    end:    { $gt: start },
  };
  if (excludeId) q._id = { $ne: excludeId };
  return Booking.findOne(q).select("_id name email type status date end").lean();
}

// ── Slot generation helpers ───────────────────────────────

/**
 * Returns all potential slot start times (Date objects) for a given day and duration.
 */
function generateSlotStarts(dayDate, durationMins) {
  const slots = [];
  const { startHour, endHour, slotIntervalMinutes } = cfg;
  const slotMs    = slotIntervalMinutes * 60_000;
  const durationMs = durationMins * 60_000;

  let current = new Date(dayDate);
  current.setHours(startHour, 0, 0, 0);

  const hardEnd = new Date(dayDate);
  hardEnd.setHours(endHour, 0, 0, 0);

  while (true) {
    const slotEnd = new Date(current.getTime() + durationMs);
    if (slotEnd > hardEnd) break;
    slots.push(new Date(current));
    current = new Date(current.getTime() + slotMs);
  }
  return slots;
}

/**
 * Returns available slot strings ("HH:MM") for a given day date and duration.
 */
async function getAvailableSlotsForDate(dayDate, durationMins) {
  const bufferMs   = cfg.bufferMinutes * 60_000;
  const durationMs = durationMins * 60_000;

  const potentialStarts = generateSlotStarts(dayDate, durationMins);
  if (!potentialStarts.length) return [];

  // Fetch all bookings that could affect this day (include buffer on each side)
  const fetchFrom = new Date(potentialStarts[0].getTime() - bufferMs);
  const fetchTo   = new Date(
    potentialStarts[potentialStarts.length - 1].getTime() + durationMs + bufferMs
  );

  const bookings = await Booking.find({
    status: { $nin: ["cancelled"] },
    date:   { $lt: fetchTo   },
    end:    { $gt: fetchFrom },
  }).lean();

  const available = [];
  for (const slotStart of potentialStarts) {
    const slotEnd    = new Date(slotStart.getTime() + durationMs);
    const checkStart = new Date(slotStart.getTime() - bufferMs);
    const checkEnd   = new Date(slotEnd.getTime()   + bufferMs);

    const blocked = bookings.some((b) => {
      const bStart = new Date(b.date);
      const bEnd   = new Date(b.end);
      return bStart < checkEnd && bEnd > checkStart;
    });

    if (!blocked) {
      const hh = String(slotStart.getHours()).padStart(2, "0");
      const mm = String(slotStart.getMinutes()).padStart(2, "0");
      available.push(`${hh}:${mm}`);
    }
  }
  return available;
}

/**
 * Classifies all slots for a day into available / taken / unavailable.
 * Returns arrays of "H:MM AM/PM" strings.
 */
async function classifySlots(dayDate, durationMins) {
  const bufferMs   = cfg.bufferMinutes * 60_000;
  const durationMs = durationMins * 60_000;
  const now        = new Date();

  const potentialStarts = generateSlotStarts(dayDate, durationMins);
  if (!potentialStarts.length) return { available: [], taken: [], unavailable: [] };

  const fetchFrom = new Date(potentialStarts[0].getTime() - bufferMs);
  const fetchTo   = new Date(potentialStarts[potentialStarts.length - 1].getTime() + durationMs + bufferMs);

  const bookings = await Booking.find({
    status: { $nin: ["cancelled"] },
    date:   { $lt: fetchTo   },
    end:    { $gt: fetchFrom },
  }).lean();

  const available = [], taken = [], unavailable = [];

  for (const slotStart of potentialStarts) {
    const slotEnd    = new Date(slotStart.getTime() + durationMs);
    const checkStart = new Date(slotStart.getTime() - bufferMs);
    const checkEnd   = new Date(slotEnd.getTime()   + bufferMs);
    const label      = formatTimeAmPm(slotStart);

    // Past slot (for today)
    if (slotStart <= now) { unavailable.push(label); continue; }

    // Directly blocked by a booking
    const directConflict = bookings.some((b) => {
      const bStart = new Date(b.date); const bEnd = new Date(b.end);
      return bStart < slotEnd && bEnd > slotStart;
    });
    if (directConflict) { taken.push(label); continue; }

    // Buffer-blocked
    const bufferConflict = bookings.some((b) => {
      const bStart = new Date(b.date); const bEnd = new Date(b.end);
      return bStart < checkEnd && bEnd > checkStart;
    });
    if (bufferConflict) { unavailable.push(label); continue; }

    available.push(label);
  }

  return { available, taken, unavailable };
}

/**
 * Finds the next date (after `fromDate`) that has at least one available slot.
 */
async function findNextAvailableDay(fromDate, durationMins) {
  const today   = new Date();  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today.getTime() + cfg.maxBookingDaysAhead * 86_400_000);

  let check = new Date(fromDate);
  check.setDate(check.getDate() + 1);

  while (check <= maxDate) {
    if (cfg.businessDays.includes(check.getDay())) {
      const slots = await getAvailableSlotsForDate(check, durationMins);
      if (slots.length) return { date: formatDateStr(check), slots };
    }
    check.setDate(check.getDate() + 1);
  }
  return null;
}

// ── Controllers ──────────────────────────────────────────

/** Stats */
async function getStats(_req, res) {
  try {
    const now  = new Date();
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const [total, pending, upcoming] = await Promise.all([
      Booking.estimatedDocumentCount(),
      Booking.countDocuments({ status: { $in: ["pending", "new", "confirmed"] } }),
      Booking.countDocuments({
        date:   { $gte: now, $lte: in30 },
        status: { $nin: ["cancelled"] },
      }),
    ]);
    res.json({ total, pending, upcoming });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/**
 * GET /api/bookings/availability?date=YYYY-MM-DD&duration=2
 * Returns available, taken, and unavailable slots for a specific date.
 * `duration` is in hours (e.g. 2 = 2 hours).
 */
async function availability(req, res) {
  try {
    const { date, duration } = req.query;
    const durationHours = Math.max(0.5, Math.min(8, Number(duration || 1)));
    const durationMins  = Math.round(durationHours * 60);

    const [y, m, d] = String(date || "").split("-").map(Number);
    const dayDate = new Date(y, m - 1, d);
    if (isNaN(dayDate.getTime()))
      return res.status(400).json({ message: "Invalid date" });

    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today.getTime() + cfg.maxBookingDaysAhead * 86_400_000);

    if (!cfg.businessDays.includes(dayDate.getDay()) || dayDate < today || dayDate > maxDate) {
      const next = await findNextAvailableDay(dayDate, durationMins);
      return res.json({
        date,
        availableSlots: [], takenSlots: [], unavailableSlots: [],
        nextAvailable: next ? { date: next.date, slots: next.slots.map(amPmFromHHMM) } : null,
      });
    }

    const { available, taken, unavailable } = await classifySlots(dayDate, durationMins);

    let nextAvailable = null;
    if (!available.length) {
      const next = await findNextAvailableDay(dayDate, durationMins);
      if (next) nextAvailable = { date: next.date, slots: next.slots.map(amPmFromHHMM) };
    }

    // Build unified slots array with startTime + endTime for each slot
    const allStarts = generateSlotStarts(dayDate, durationMins);
    const slots = allStarts.map((slotStart) => {
      const slotEnd   = new Date(slotStart.getTime() + durationMins * 60_000);
      const startTime = formatTimeAmPm(slotStart);
      const endTime   = formatTimeAmPm(slotEnd);
      const status    = taken.includes(startTime)
        ? "taken"
        : unavailable.includes(startTime)
          ? "unavailable"
          : "available";
      return { startTime, endTime, status };
    });

    res.json({ date, duration: durationHours, availableSlots: available, takenSlots: taken, unavailableSlots: unavailable, slots, nextAvailable });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/**
 * GET /api/bookings/slots?date=YYYY-MM-DD&duration=120
 * Returns available time slots for a specific date and duration.
 */
async function getSlots(req, res) {
  try {
    const { date, duration } = req.query;
    const durationMins = Math.max(30, Math.min(480, Number(duration || 60)));

    const [y, m, d] = String(date || "").split("-").map(Number);
    const dayDate = new Date(y, m - 1, d);

    if (isNaN(dayDate.getTime()))
      return res.status(400).json({ message: "Invalid date" });

    // Past date
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (dayDate < today)
      return res.json({ date, availableSlots: [], nextAvailable: null });

    // Too far ahead
    const maxDate = new Date(today.getTime() + cfg.maxBookingDaysAhead * 86_400_000);
    if (dayDate > maxDate)
      return res.json({ date, availableSlots: [], nextAvailable: null });

    // Not a business day
    if (!cfg.businessDays.includes(dayDate.getDay())) {
      const next = await findNextAvailableDay(dayDate, durationMins);
      return res.json({ date, availableSlots: [], nextAvailable: next });
    }

    const availableSlots = await getAvailableSlotsForDate(dayDate, durationMins);

    let nextAvailable = null;
    if (!availableSlots.length) {
      nextAvailable = await findNextAvailableDay(dayDate, durationMins);
    }

    res.json({ date, availableSlots, nextAvailable });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/**
 * GET /api/bookings/next-availability?duration=2&limit=7
 * Returns upcoming days with available slots.
 * `duration` in hours (≤24) or minutes (>24) for backward compat.
 */
async function getNextAvailability(req, res) {
  try {
    const raw = Number(req.query.duration || 1);
    const durationMins = raw <= 24
      ? Math.round(Math.max(0.5, Math.min(8, raw)) * 60)
      : Math.max(30, Math.min(480, raw));
    const limit = Math.max(1, Math.min(30, Number(req.query.limit || 7)));

    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today.getTime() + cfg.maxBookingDaysAhead * 86_400_000);

    const results = [];
    let check = new Date(today);
    check.setDate(check.getDate() + 1);

    while (check <= maxDate && results.length < limit) {
      if (cfg.businessDays.includes(check.getDay())) {
        const slots = await getAvailableSlotsForDate(check, durationMins);
        if (slots.length) {
          results.push({ date: formatDateStr(check), slots: slots.map(amPmFromHHMM) });
        }
      }
      check.setDate(check.getDate() + 1);
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/**
 * GET /api/bookings/month-availability?month=2025-08&duration=2
 * Returns status for every day in a month. `duration` in hours.
 * Uses a single DB query for efficiency.
 */
async function getMonthAvailability(req, res) {
  try {
    const { month, duration } = req.query;
    const durationHours = Math.max(0.5, Math.min(8, Number(duration || 1)));
    const durationMins  = Math.round(durationHours * 60);

    const [y, m] = String(month || "").split("-").map(Number);
    if (!y || !m || m < 1 || m > 12)
      return res.status(400).json({ message: "Invalid month — use YYYY-MM" });

    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate    = new Date(today.getTime() + cfg.maxBookingDaysAhead * 86_400_000);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd   = new Date(y, m, 1);
    const daysInMo   = new Date(y, m, 0).getDate();
    const durationMs = durationMins * 60_000;
    const bufferMs   = cfg.bufferMinutes * 60_000;

    // Single DB query for all bookings this month
    const bookings = await Booking.find({
      status: { $nin: ["cancelled"] },
      date:   { $lt: monthEnd  },
      end:    { $gt: monthStart },
    }).lean();

    const days = [];

    for (let day = 1; day <= daysInMo; day++) {
      const dayDate = new Date(y, m - 1, day);
      const dateStr = formatDateStr(dayDate);

      if (dayDate < today || dayDate > maxDate || !cfg.businessDays.includes(dayDate.getDay())) {
        days.push({ date: dateStr, status: "unavailable" });
        continue;
      }

      const potentialStarts = generateSlotStarts(dayDate, durationMins);
      if (!potentialStarts.length) {
        days.push({ date: dateStr, status: "unavailable" });
        continue;
      }

      let hasAvailable = false;
      let hasTaken     = false;

      for (const slotStart of potentialStarts) {
        const slotEnd    = new Date(slotStart.getTime() + durationMs);
        const checkStart = new Date(slotStart.getTime() - bufferMs);
        const checkEnd   = new Date(slotEnd.getTime()   + bufferMs);

        const direct = bookings.some((b) => {
          const bS = new Date(b.date), bE = new Date(b.end);
          return bS < slotEnd && bE > slotStart;
        });
        if (direct) { hasTaken = true; continue; }

        const buffered = bookings.some((b) => {
          const bS = new Date(b.date), bE = new Date(b.end);
          return bS < checkEnd && bE > checkStart;
        });
        if (!buffered) { hasAvailable = true; break; }
      }

      if (hasAvailable)  days.push({ date: dateStr, status: "available" });
      else if (hasTaken) days.push({ date: dateStr, status: "fully-booked" });
      else               days.push({ date: dateStr, status: "unavailable" });
    }

    res.json({ month, days });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/** List */
async function getAll(req, res) {
  try {
    const { q, status, type, from, to, page = 1, limit = 20, sort = "-createdAt" } = req.query;
    const filter = {};
    if (status && ALLOWED_STATUS.includes(status)) filter.status = status;
    if (type   && ALLOWED_TYPES.includes(type))   filter.type   = type;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ name: rx }, { email: rx }, { message: rx }];
    }
    const perPage = Math.max(1, Number(limit));
    const skip    = (Math.max(1, Number(page)) - 1) * perPage;
    const [items, total] = await Promise.all([
      Booking.find(filter).sort(String(sort || "-createdAt")).skip(skip).limit(perPage),
      Booking.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / perPage) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/** Read one */
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
      "name", "email", "phone", "type", "location",
      "numberOfPeople", "preferredContactMethod", "estimatedPrice",
      "date", "time", "message", "status", "durationMinutes", "bookingDetails",
    ]);

    if (data.type   && !ALLOWED_TYPES.includes(data.type))   return res.status(400).json({ message: "Invalid type" });
    if (data.status && !ALLOWED_STATUS.includes(data.status)) return res.status(400).json({ message: "Invalid status" });

    const start = combineDateAndTime(data.date, data.time);
    if (isNaN(start.getTime())) return res.status(400).json({ message: "Invalid date/time" });

    const duration = Math.max(15, Math.min(24 * 60, Number(data.durationMinutes ?? 60)));
    const end      = new Date(start.getTime() + duration * 60_000);

    const conflict = await findConflict(start, end);
    if (conflict) {
      return res.status(409).json({
        message: "This time is no longer available. Please choose another time.",
        conflict, start, end, durationMinutes: duration,
      });
    }

    // Server-side price recalculation for config-driven session types (e.g. Real Estate).
    // This overwrites whatever the client sent so users cannot manipulate the price.
    let finalPrice      = data.estimatedPrice ? Number(data.estimatedPrice) : undefined;
    let finalDetails    = data.bookingDetails  || undefined;
    const priceResult   = await recalculatePrice(data.type, data.bookingDetails);
    if (priceResult) {
      finalPrice   = priceResult.total;
      finalDetails = { ...(data.bookingDetails || {}), pricingSnapshot: priceResult.snapshot };
    }

    const doc = await Booking.create({
      name:                   data.name,
      email:                  data.email,
      phone:                  data.phone ? String(data.phone) : undefined,
      type:                   data.type,
      location:               data.location,
      numberOfPeople:         data.numberOfPeople  || undefined,
      preferredContactMethod: data.preferredContactMethod || undefined,
      estimatedPrice:         finalPrice,
      bookingDetails:         finalDetails,
      date:                   start,
      end,
      durationMinutes:        duration,
      message:                data.message,
      status:                 data.status || "pending",
    });

    // Fire-and-forget emails
    (async () => {
      try {
        if (NOTIFY_EMAIL) {
          const msg = adminNotification(doc.toObject());
          await sendMail({ to: NOTIFY_EMAIL, subject: msg.subject, text: msg.text, html: msg.html, replyTo: doc.email || undefined });
        }
        if (doc.email) {
          const msg = customerConfirmation(doc.toObject());
          await sendMail({ to: doc.email, subject: msg.subject, text: msg.text, html: msg.html });
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
      "name", "email", "phone", "type", "location",
      "numberOfPeople", "preferredContactMethod", "estimatedPrice",
      "date", "time", "message", "status", "durationMinutes", "bookingDetails",
    ]);

    if (data.type   && !ALLOWED_TYPES.includes(data.type))   return res.status(400).json({ message: "Invalid type" });
    if (data.status && !ALLOWED_STATUS.includes(data.status)) return res.status(400).json({ message: "Invalid status" });

    const patch = {
      ...pick(data, ["name", "email", "phone", "type", "location",
        "numberOfPeople", "preferredContactMethod", "estimatedPrice",
        "bookingDetails", "message", "status"]),
    };

    if (typeof data.date !== "undefined" || typeof data.time !== "undefined" || typeof data.durationMinutes !== "undefined") {
      const current = await Booking.findById(req.params.id);
      if (!current) return res.status(404).json({ message: "Booking not found" });

      const baseStart = (typeof data.date !== "undefined" || typeof data.time !== "undefined")
        ? combineDateAndTime(data.date ?? current.date.toISOString(), data.time)
        : current.date;

      if (isNaN(baseStart.getTime())) return res.status(400).json({ message: "Invalid date/time" });

      const dur = Math.max(15, Math.min(24 * 60, Number(data.durationMinutes ?? current.durationMinutes ?? 60)));
      const end = new Date(baseStart.getTime() + dur * 60_000);

      patch.date            = baseStart;
      patch.end             = end;
      patch.durationMinutes = dur;

      const targetStatus = patch.status ?? current.status;
      if (targetStatus !== "cancelled") {
        const conflict = await findConflict(baseStart, end, current._id);
        if (conflict) {
          return res.status(409).json({ message: "This time is already booked.", conflict, start: baseStart, end, durationMinutes: dur });
        }
      }
    }

    const doc = await Booking.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

/** Set status */
async function setStatus(req, res) {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const current = await Booking.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Booking not found" });

    if (status !== "cancelled") {
      const conflict = await findConflict(current.date, current.end, current._id);
      if (conflict) {
        return res.status(409).json({ message: "Cannot set status: slot is already booked.", conflict, start: current.date, end: current.end, durationMinutes: current.durationMinutes });
      }
    }

    const doc = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: "Booking not found" });

    (async () => {
      try {
        if (doc.email) {
          await sendMail({
            to: doc.email,
            subject: `Your booking is ${status}`,
            text: `Hi ${doc.name || ""}, your booking is now ${status}.`,
            html: `<p>Hi ${doc.name || ""}, your booking is now <strong>${status}</strong>.</p>`,
          });
        }
      } catch (err) { console.error("Email send error:", err); }
    })();

    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function bulkStatus(req, res) {
  const { ids = [], status } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: "ids required" });
  if (!ALLOWED_STATUS.includes(status))   return res.status(400).json({ message: "Invalid status" });
  const r = await Booking.updateMany({ _id: { $in: ids } }, { $set: { status } });
  res.json({ matched: r.matchedCount ?? r.n, modified: r.modifiedCount ?? r.nModified, status });
}

async function bulkDelete(req, res) {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: "ids required" });
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
  if (type   && ALLOWED_TYPES.includes(type))   filter.type   = type;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);
  }
  if (q) {
    const rx = new RegExp(q, "i");
    filter.$or = [{ name: rx }, { email: rx }, { message: rx }];
  }

  const rows = await Booking.find(filter).sort("-createdAt").lean();
  const header = "name,email,phone,type,location,numberOfPeople,status,start,end,durationMinutes,estimatedPrice,createdAt\n";
  const body = rows.map((r) =>
    [
      r.name, r.email, r.phone ?? "", r.type ?? "", r.location ?? "",
      r.numberOfPeople ?? "", r.status ?? "",
      r.date     ? new Date(r.date).toISOString()      : "",
      r.end      ? new Date(r.end).toISOString()       : "",
      r.durationMinutes ?? "", r.estimatedPrice ?? "",
      r.createdAt ? new Date(r.createdAt).toISOString() : "",
    ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="bookings.csv"');
  res.send(header + body);
}

module.exports = {
  availability,
  getSlots,
  getNextAvailability,
  getMonthAvailability,
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
