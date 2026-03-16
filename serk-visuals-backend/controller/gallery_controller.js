// controller/gallery_controller.js
const GalleryItem = require("../models/gallery_model");
const { PLACEMENTS } = require("../models/gallery_model");
const { publicUrlFromKey, deleteByUrl, headObject } = require("../config/s3");

const pick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

/**
 * Normalize image URLs in a gallery item before sending to client.
 * New records already store absolute URLs, but this is a safety net for any
 * legacy records that may have an S3 key or relative path in the url field.
 */
const absolutize = (_req, item) => {
  if (!item) return item;
  const out = { ...item };
  if (out.url && !out.url.startsWith("http")) {
    out.url = publicUrlFromKey(out.url);
  }
  if (out.thumbnail && !out.thumbnail.startsWith("http")) {
    out.thumbnail = publicUrlFromKey(out.thumbnail);
  }
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

/**
 * CREATE (JSON)
 * body: { title, album, tags?, published?, placement?, order?, imageKey, thumbKey? }
 */
exports.create = async (req, res) => {
  try {
    const body = pick(req.body, [
      "title",
      "album",
      "tags",
      "published",
      "placement",
      "order",
      "imageKey",
      "thumbKey",
    ]);
    if (!body.title || !body.album || !body.imageKey) {
      return res
        .status(400)
        .json({ message: "title, album, and imageKey are required" });
    }

    // (Optional) verify the objects exist
    await headObject(body.imageKey);
    if (body.thumbKey) await headObject(body.thumbKey);

    const tags = Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === "string"
      ? body.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const placement = PLACEMENTS.includes(body.placement)
      ? body.placement
      : "gallery";
    const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

    const doc = await GalleryItem.create({
      title: body.title,
      album: body.album,
      placement,
      order,
      url: publicUrlFromKey(body.imageKey),
      thumbnail: body.thumbKey ? publicUrlFromKey(body.thumbKey) : undefined,
      tags,
      published:
        body.published === false || body.published === "false" ? false : true,
    });

    res.status(201).json(absolutize(req, doc.toObject()));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/**
 * UPDATE (JSON)
 * body: fields + optional imageKey/thumbKey to replace media
 */

exports.update = async (req, res) => {
  try {
    const before = await GalleryItem.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: "Not found" });

    const body = pick(req.body, [
      "title",
      "album",
      "tags",
      "published",
      "placement",
      "order",
      "imageKey",
      "thumbKey",
    ]);
    const patch = {};

    if (typeof body.title !== "undefined") patch.title = body.title;
    if (typeof body.album !== "undefined") patch.album = body.album;
    if (typeof body.published !== "undefined")
      patch.published = body.published === true || body.published === "true";
    if (typeof body.placement !== "undefined") {
      patch.placement = PLACEMENTS.includes(body.placement)
        ? body.placement
        : "gallery";
    }
    if (typeof body.order !== "undefined")
      patch.order = Number(body.order) || 0;
    if (typeof body.tags !== "undefined") {
      patch.tags = Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === "string"
        ? body.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    }

    let newMainUrl, newThumbUrl;
    if (body.imageKey) {
      await headObject(body.imageKey);
      newMainUrl = publicUrlFromKey(body.imageKey);
      patch.url = newMainUrl;
    }
    if (body.thumbKey) {
      await headObject(body.thumbKey);
      newThumbUrl = publicUrlFromKey(body.thumbKey);
      patch.thumbnail = newThumbUrl;
    }

    const doc = await GalleryItem.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();

    // Clean up old objects if replaced
    if (newMainUrl && before.url && before.url !== newMainUrl)
      await deleteByUrl(before.url);
    if (newThumbUrl && before.thumbnail && before.thumbnail !== newThumbUrl)
      await deleteByUrl(before.thumbnail);

    res.json(absolutize(req, doc));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const doc = await GalleryItem.findByIdAndDelete(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
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
