// controller/gallery_controller.js
const GalleryItem = require("../models/gallery_model");
const { PLACEMENTS } = require("../models/gallery_model");
const { uploadBufferToS3, deleteByUrl } = require("../config/s3");

const pick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

const absolutize = (req, item) => {
  if (!item) return item;
  // If already http(s), return as-is; legacy relative URLs get prefix.
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
      sort = "-createdAt",
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

    const placement = PLACEMENTS.includes(body.placement)
      ? body.placement
      : "gallery";
    const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

    // Upload to S3
    const mainUp = await uploadBufferToS3({
      buffer: image.buffer,
      mimetype: image.mimetype,
      originalname: image.originalname,
      folder: "uploads/gallery",
    });

    let thumbUrl;
    if (thumb) {
      const t = await uploadBufferToS3({
        buffer: thumb.buffer,
        mimetype: thumb.mimetype,
        originalname: thumb.originalname,
        folder: "uploads/gallery",
      });
      thumbUrl = t.url;
    }

    const doc = await GalleryItem.create({
      title: body.title,
      album: body.album,
      placement,
      order,
      url: mainUp.url,
      thumbnail: thumbUrl,
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
    const before = await GalleryItem.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: "Not found" });

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

    // If new files are provided, upload first
    let newMainUrl, newThumbUrl;
    if (image) {
      const up = await uploadBufferToS3({
        buffer: image.buffer,
        mimetype: image.mimetype,
        originalname: image.originalname,
        folder: "uploads/gallery",
      });
      newMainUrl = up.url;
      patch.url = newMainUrl;
    }
    if (thumb) {
      const up = await uploadBufferToS3({
        buffer: thumb.buffer,
        mimetype: thumb.mimetype,
        originalname: thumb.originalname,
        folder: "uploads/gallery",
      });
      newThumbUrl = up.url;
      patch.thumbnail = newThumbUrl;
    }

    const doc = await GalleryItem.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();

    // After successful DB update, delete the old objects if replaced
    if (image && before.url && before.url !== newMainUrl) {
      await deleteByUrl(before.url);
    }
    if (thumb && before.thumbnail && before.thumbnail !== newThumbUrl) {
      await deleteByUrl(before.thumbnail);
    }

    res.json(absolutize(req, doc));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const doc = await GalleryItem.findByIdAndDelete(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });

    // Best-effort delete of S3 objects
    if (doc.url) await deleteByUrl(doc.url);
    if (doc.thumbnail) await deleteByUrl(doc.thumbnail);

    res.status(204).send();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.removeAll = async (_req, res) => {
  try {
    const docs = await GalleryItem.find({}, { url: 1, thumbnail: 1 }).lean();
    await GalleryItem.deleteMany({});

    // Fire-and-forget deletes
    await Promise.allSettled([
      ...docs.map((d) => (d.url ? deleteByUrl(d.url) : null)),
      ...docs.map((d) => (d.thumbnail ? deleteByUrl(d.thumbnail) : null)),
    ]);

    res.status(204).send();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

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
