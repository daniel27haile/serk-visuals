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
