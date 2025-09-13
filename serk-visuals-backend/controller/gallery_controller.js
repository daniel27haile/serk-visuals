const GalleryItem = require("../models/gallery_model");
const { PLACEMENTS } = require("../models/gallery_model");

const pick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

const absolutize = (req, item) => {
  if (!item) return item;
  const host = `${req.protocol}://${req.get("host")}`;
  const out = { ...item };
  if (out.url && !/^https?:\/\//i.test(out.url)) out.url = host + out.url;
  if (out.thumbnail && !/^https?:\/\//i.test(out.thumbnail))
    out.thumbnail = host + out.thumbnail;
  return out;
};

exports.list = async (req, res) => {
  try {
    const {
      album,
      placement,
      q,
      page = 1,
      limit = 24,
      published,
      sort = "-createdAt", // allow custom sort e.g. "order,-createdAt"
    } = req.query;

    const filter = {};
    if (album) filter.album = album;
    if (placement && PLACEMENTS.includes(placement))
      filter.placement = placement;
    if (published === "true") filter.published = true;
    if (published === "false") filter.published = false;
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ title: rx }, { tags: rx }];
    }

    const per = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * per;

    // support multi-field sort: "order,-createdAt"
    const sortObj = {};
    String(sort)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => {
        if (s.startsWith("-")) sortObj[s.slice(1)] = -1;
        else sortObj[s] = 1;
      });

    const [items, total] = await Promise.all([
      GalleryItem.find(filter).sort(sortObj).skip(skip).limit(per).lean(),
      GalleryItem.countDocuments(filter),
    ]);

    res.json({
      items: items.map((i) => absolutize(req, i)),
      total,
      page: Number(page),
      pages: Math.ceil(total / per),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await GalleryItem.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(absolutize(req, doc));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const image = req.files?.image?.[0];
    if (!image) return res.status(400).json({ message: "Image is required" });

    const thumb = req.files?.thumb?.[0];
    const body = pick(req.body, [
      "title",
      "album",
      "tags",
      "published",
      "placement",
      "order",
    ]);

    const tags =
      typeof body.tags === "string"
        ? body.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(body.tags)
        ? body.tags
        : [];

    // validate placement
    const placement = PLACEMENTS.includes(body.placement)
      ? body.placement
      : "gallery";

    const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

    const doc = await GalleryItem.create({
      title: body.title,
      album: body.album,
      placement,
      order,
      url: `/uploads/gallery/${image.filename}`,
      thumbnail: thumb ? `/uploads/gallery/${thumb.filename}` : undefined,
      tags,
      published: body.published === "false" ? false : true,
    });

    res.status(201).json(absolutize(req, doc.toObject()));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const image = req.files?.image?.[0];
    const thumb = req.files?.thumb?.[0];
    const body = pick(req.body, [
      "title",
      "album",
      "tags",
      "published",
      "placement",
      "order",
    ]);

    const patch = {};
    if (body.title) patch.title = body.title;
    if (body.album) patch.album = body.album;
    if (typeof body.published !== "undefined")
      patch.published = body.published === "true";

    if (typeof body.placement !== "undefined") {
      patch.placement = PLACEMENTS.includes(body.placement)
        ? body.placement
        : "gallery";
    }
    if (typeof body.order !== "undefined") {
      const n = Number(body.order);
      patch.order = Number.isFinite(n) ? n : 0;
    }

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
    if (image) patch.url = `/uploads/gallery/${image.filename}`;
    if (thumb) patch.thumbnail = `/uploads/gallery/${thumb.filename}`;

    const doc = await GalleryItem.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(absolutize(req, doc));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const doc = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.removeAll = async (_req, res) => {
  try {
    await GalleryItem.deleteMany({});
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/** Optional: batch reorder for slider/featured */
exports.reorder = async (req, res) => {
  try {
    const { items = [] } = req.body || {};
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ message: "items required" });

    const ops = items
      .filter((x) => x?.id)
      .map((x) => ({
        updateOne: {
          filter: { _id: x.id },
          update: { $set: { order: Number(x.order) || 0 } },
        },
      }));

    if (!ops.length) return res.json({ matched: 0, modified: 0 });

    const r = await GalleryItem.bulkWrite(ops);
    res.json({
      matched: r.matchedCount ?? r.nMatched ?? 0,
      modified: r.modifiedCount ?? r.nModified ?? 0,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
