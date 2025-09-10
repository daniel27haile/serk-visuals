// controllers/contact-us.controller.js
const ContactUs = require("../models/contact-us_model");
const { createContactSchema } = require("../config/contact-us_validation");

exports.create = async (req, res, next) => {
  try {
    const data = createContactSchema.parse(req.body);

    const doc = await ContactUs.create({
      ...data,
      meta: {
        ip: req.ip,
        userAgent: req.get("user-agent") || "",
        referrer: req.get("referer") || "",
      },
    });

    // Minimal response; you can expand if needed
    res
      .status(201)
      .location(`/api/contact-us/${doc._id}`)
      .json({ id: doc._id, message: "Success", data: doc });
  } catch (err) {
    // Zod validation errors → 400
    if (err?.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Invalid input", details: err.errors });
    }
    next(err); // let global error handler map to 500
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const doc = await ContactUs.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Contact message not found" });
    res.json(doc);
  } catch (err) {
    next(err); // let global error handler map to 500
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await ContactUs.countDocuments(filter);
    const items = await ContactUs.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));
    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err); // let global error handler map to 500
  }
};
