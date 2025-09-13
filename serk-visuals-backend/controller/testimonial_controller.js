const Testimonial = require("../models/testimonial_model");

const absolutize = (req, obj) => {
  if (!obj) return obj;
  const host = `${req.protocol}://${req.get("host")}`;
  const out = { ...obj };
  if (out.avatar && !/^https?:\/\//i.test(out.avatar))
    out.avatar = host + out.avatar;
  return out;
};

exports.list = async (req, res, next) => {
  try {
    const {
      q,
      page = 1,
      limit = 20,
      published,
      sort = "order,-createdAt",
    } = req.query;
    const filter = {};
    if (published === "true") filter.published = true;
    if (published === "false") filter.published = false;
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ author: rx }, { role: rx }, { quote: rx }];
    }

    const per = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * per;

    const items = await Testimonial.find(filter)
      .sort(sort.split(",").join(" "))
      .skip(skip)
      .limit(per)
      .lean();

    const total = await Testimonial.countDocuments(filter);
    res.json({
      items: items.map((i) => absolutize(req, i)),
      total,
      page: Number(page),
      pages: Math.ceil(total / per),
    });
  } catch (e) {
    next(e);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const doc = await Testimonial.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(absolutize(req, doc));
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { author, role, quote, published, order } = req.body;
    if (!author || !quote)
      return res.status(400).json({ message: "author and quote are required" });

    const avatar = req.file
      ? `/uploads/testimonials/${req.file.filename}`
      : undefined;

    const doc = await Testimonial.create({
      author,
      role,
      quote,
      avatar,
      published: published === "false" ? false : true,
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    });

    res.status(201).json(absolutize(req, doc.toObject()));
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const patch = {};
    ["author", "role", "quote"].forEach((k) => {
      if (typeof req.body[k] !== "undefined") patch[k] = req.body[k];
    });
    if (typeof req.body.published !== "undefined")
      patch.published = req.body.published === "true";
    if (typeof req.body.order !== "undefined")
      patch.order = Number(req.body.order) || 0;

    if (req.file) patch.avatar = `/uploads/testimonials/${req.file.filename}`;

    const doc = await Testimonial.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(absolutize(req, doc));
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await Testimonial.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

exports.removeAll = async (_req, res, next) => {
  try {
    await Testimonial.deleteMany({});
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
