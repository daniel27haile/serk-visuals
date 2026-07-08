// routes/gallery_routes.js
const express = require("express");
const ctrl = require("../controller/gallery_controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { publicCache } = require("../middleware/cache");
const { validateId } = require("../middleware/validate");

const router = express.Router();

// /albums must be before /:id so "albums" is not matched as an ObjectId
router.get("/albums", publicCache(60, 120), ctrl.getAlbums);
router.get("/", publicCache(60, 120), ctrl.list);
router.get("/:id", ctrl.getOne);

// Admin-only mutations
router.post("/", requireAuth, requireRole(["admin"]), ctrl.create);
router.patch("/:id", requireAuth, requireRole(["admin"]), ctrl.update);
router.delete("/:id", requireAuth, requireRole(["admin"]), ctrl.remove);
router.delete("/", requireAuth, requireRole(["admin"]), ctrl.removeAll);
router.post("/reorder", requireAuth, requireRole(["admin"]), ctrl.reorder);
router.post("/:id/cover", requireAuth, requireRole(["admin"]), validateId, ctrl.setCover);

module.exports = router;
