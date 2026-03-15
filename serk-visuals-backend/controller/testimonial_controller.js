// controller/testimonial_controller.js
const Testimonial = require("../models/testimonial_model");
const { publicUrlFromKey, deleteByUrl, headObject } = require("../config/s3");

const absolutize = (_req, obj) => obj;

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

/**
 * CREATE (JSON)
 * body: { author, role?, quote, published?, order?, avatarKey? }
 */
exports.create = async (req, res, next) => {
  try {
    const { author, role, quote, published, order, avatarKey } = req.body || {};
    if (!author || !quote)
      return res.status(400).json({ message: "author and quote are required" });

    let avatar;
    if (avatarKey) {
      await headObject(avatarKey);
      avatar = publicUrlFromKey(avatarKey);
    }

    const doc = await Testimonial.create({
      author,
      role,
      quote,
      avatar,
      published: published === false || published === "false" ? false : true,
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    });

    res.status(201).json(absolutize(req, doc.toObject()));
  } catch (e) {
    next(e);
  }
};

/**
 * UPDATE (JSON)
 * body may include: author, role, quote, published, order, avatarKey
 */
exports.update = async (req, res, next) => {
  try {
    const patch = {};
    ["author", "role", "quote"].forEach((k) => {
      if (typeof req.body[k] !== "undefined") patch[k] = req.body[k];
    });
    if (typeof req.body.published !== "undefined")
      patch.published =
        req.body.published === true || req.body.published === "true";
    if (typeof req.body.order !== "undefined")
      patch.order = Number(req.body.order) || 0;

    let newAvatarUrl;
    if (req.body.avatarKey) {
      await headObject(req.body.avatarKey);
      newAvatarUrl = publicUrlFromKey(req.body.avatarKey);
      patch.avatar = newAvatarUrl;
    }

    const before = await Testimonial.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: "Not found" });

    const doc = await Testimonial.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();

    if (newAvatarUrl && before.avatar && before.avatar !== newAvatarUrl) {
      await deleteByUrl(before.avatar);
    }

    res.json(absolutize(req, doc));
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await Testimonial.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.avatar) await deleteByUrl(doc.avatar);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

exports.removeAll = async (_req, res, next) => {
  try {
    const docs = await Testimonial.find({}, { avatar: 1 }).lean();
    await Testimonial.deleteMany({});
    await Promise.allSettled(
      docs.map((d) => (d.avatar ? deleteByUrl(d.avatar) : null))
    );
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
