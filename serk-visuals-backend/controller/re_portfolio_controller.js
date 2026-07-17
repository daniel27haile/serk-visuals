// controller/re_portfolio_controller.js
const REPortfolio = require('../models/re_portfolio_model');
const { publicUrlFromKey } = require('../config/s3');

// Derive stable CDN URLs from stored S3 keys
function serialize(doc) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };

  if (p.coverImageKey) p.coverUrl = publicUrlFromKey(p.coverImageKey);
  if (p.coverThumbKey) p.coverThumbUrl = publicUrlFromKey(p.coverThumbKey);
  else if (p.coverImageKey) p.coverThumbUrl = p.coverUrl;

  p.images = (p.images || [])
    .map((img) => {
      const out = { ...img };
      if (out.imageKey) out.url = publicUrlFromKey(out.imageKey);
      if (out.thumbKey) out.thumbnail = publicUrlFromKey(out.thumbKey);
      else if (out.imageKey) out.thumbnail = out.url;
      return out;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return p;
}

// ── Public ───────────────────────────────────────────────────────────────────

// GET /api/portfolio/real-estate
async function listPublic(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const filter = { published: true };
    if (req.query.featured === 'true') filter.featured = true;

    const [docs, total] = await Promise.all([
      REPortfolio.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
      REPortfolio.countDocuments(filter),
    ]);

    res.json({
      items: docs.map(serialize),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[RE Portfolio] listPublic:', err);
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
}

// GET /api/portfolio/real-estate/:slug
async function getBySlug(req, res) {
  try {
    const doc = await REPortfolio.findOne({ slug: req.params.slug, published: true });
    if (!doc) return res.status(404).json({ error: 'Project not found' });
    res.json(serialize(doc));
  } catch (err) {
    console.error('[RE Portfolio] getBySlug:', err);
    res.status(500).json({ error: 'Failed to load project' });
  }
}

// ── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/portfolio/real-estate
async function adminList(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.published === 'true')  filter.published = true;
    if (req.query.published === 'false') filter.published = false;
    if (req.query.featured  === 'true')  filter.featured  = true;

    const [docs, total] = await Promise.all([
      REPortfolio.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
      REPortfolio.countDocuments(filter),
    ]);

    res.json({
      items: docs.map(serialize),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[RE Portfolio] adminList:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
}

// GET /api/admin/portfolio/real-estate/:id
async function adminGet(req, res) {
  try {
    const doc = await REPortfolio.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(serialize(doc));
  } catch (err) {
    console.error('[RE Portfolio] adminGet:', err);
    res.status(500).json({ error: 'Failed to load project' });
  }
}

// POST /api/admin/portfolio/real-estate
async function adminCreate(req, res) {
  try {
    const { title, slug, coverImageKey, coverThumbKey, propertyType, location, description, featured, published, order } = req.body;
    if (!title || !slug || !coverImageKey) {
      return res.status(400).json({ error: 'title, slug, and coverImageKey are required' });
    }

    const doc = await REPortfolio.create({
      title,
      slug,
      coverImageKey,
      coverUrl:      publicUrlFromKey(coverImageKey),
      coverThumbKey: coverThumbKey || null,
      coverThumbUrl: coverThumbKey ? publicUrlFromKey(coverThumbKey) : publicUrlFromKey(coverImageKey),
      propertyType:  propertyType  || 'Residential',
      location:      location      || '',
      description:   description   || '',
      featured:      !!featured,
      published:     !!published,
      order:         Number(order) || 0,
      images:        [],
    });

    res.status(201).json(serialize(doc));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A project with this slug already exists' });
    console.error('[RE Portfolio] adminCreate:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
}

// PATCH /api/admin/portfolio/real-estate/:id
async function adminUpdate(req, res) {
  try {
    const FIELDS = ['title', 'slug', 'coverImageKey', 'coverThumbKey', 'propertyType', 'location', 'description', 'featured', 'published', 'order'];
    const patch = {};
    for (const key of FIELDS) {
      if (key in req.body) patch[key] = req.body[key];
    }
    if (patch.coverImageKey) patch.coverUrl = publicUrlFromKey(patch.coverImageKey);
    if (patch.coverThumbKey) patch.coverThumbUrl = publicUrlFromKey(patch.coverThumbKey);
    else if (patch.coverImageKey) patch.coverThumbUrl = patch.coverUrl;

    const doc = await REPortfolio.findByIdAndUpdate(
      req.params.id,
      { $set: patch },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(serialize(doc));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A project with this slug already exists' });
    console.error('[RE Portfolio] adminUpdate:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
}

// DELETE /api/admin/portfolio/real-estate/:id
async function adminDelete(req, res) {
  try {
    const doc = await REPortfolio.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[RE Portfolio] adminDelete:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
}

// POST /api/admin/portfolio/real-estate/:id/images
async function adminAddImage(req, res) {
  try {
    const { imageKey, thumbKey, alt, order } = req.body;
    if (!imageKey) return res.status(400).json({ error: 'imageKey is required' });

    const img = {
      imageKey,
      thumbKey:  thumbKey || null,
      url:       publicUrlFromKey(imageKey),
      thumbnail: thumbKey ? publicUrlFromKey(thumbKey) : publicUrlFromKey(imageKey),
      alt:       alt || '',
      order:     Number(order) || 0,
    };

    const doc = await REPortfolio.findByIdAndUpdate(
      req.params.id,
      { $push: { images: img } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(serialize(doc));
  } catch (err) {
    console.error('[RE Portfolio] adminAddImage:', err);
    res.status(500).json({ error: 'Failed to add image' });
  }
}

// DELETE /api/admin/portfolio/real-estate/:id/images/:imgId
async function adminRemoveImage(req, res) {
  try {
    const doc = await REPortfolio.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: { _id: req.params.imgId } } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(serialize(doc));
  } catch (err) {
    console.error('[RE Portfolio] adminRemoveImage:', err);
    res.status(500).json({ error: 'Failed to remove image' });
  }
}

// PATCH /api/admin/portfolio/real-estate/:id/images/reorder
async function adminReorderImages(req, res) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

    const doc = await REPortfolio.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    for (const { id, order } of items) {
      const img = doc.images.id(id);
      if (img) img.order = order;
    }
    await doc.save();
    res.json(serialize(doc));
  } catch (err) {
    console.error('[RE Portfolio] adminReorderImages:', err);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
}

// PATCH /api/admin/portfolio/real-estate/reorder
async function adminReorderProjects(req, res) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

    const ops = items.map(({ id, order }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order } } },
    }));
    await REPortfolio.bulkWrite(ops);
    res.json({ success: true });
  } catch (err) {
    console.error('[RE Portfolio] adminReorderProjects:', err);
    res.status(500).json({ error: 'Failed to reorder projects' });
  }
}

module.exports = {
  listPublic,
  getBySlug,
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminAddImage,
  adminRemoveImage,
  adminReorderImages,
  adminReorderProjects,
};
