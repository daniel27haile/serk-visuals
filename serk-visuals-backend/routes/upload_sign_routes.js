// routes/upload_sign_routes.js
const router = require("express").Router();
const { signPutObject, ALLOWED_CT } = require("../config/s3");
const { requireAuth, requireRole } = require("../middleware/auth");

// Admin-only (adjust if you want users to upload directly)
router.use(requireAuth, requireRole(["admin"]));

/**
 * POST /api/uploads/sign
 * body: { contentType: string, ext?: string, folder?: string, expiresIn?: number }
 * returns: { url, key, publicUrl, expiresIn }
 */
router.post("/sign", async (req, res) => {
  try {
    const { contentType, ext, folder, expiresIn } = req.body || {};
    if (!contentType || !ALLOWED_CT.has(contentType)) {
      return res
        .status(400)
        .json({ message: "Unsupported or missing contentType" });
    }
    const out = await signPutObject({ contentType, ext, folder, expiresIn });
    res.json(out);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
