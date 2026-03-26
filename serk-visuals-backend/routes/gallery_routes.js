// routes/gallery_routes.js
const express = require("express");
const ctrl = require("../controller/gallery_controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { publicCache } = require("../middleware/cache");

const router = express.Router();

router.get("/", publicCache(30, 60), ctrl.list);
router.get("/:id", ctrl.getOne);

// Admin-only for mutations
router.post("/", requireAuth, requireRole(["admin"]), ctrl.create);
router.patch("/:id", requireAuth, requireRole(["admin"]), ctrl.update);
router.delete("/:id", requireAuth, requireRole(["admin"]), ctrl.remove);
router.delete("/", requireAuth, requireRole(["admin"]), ctrl.removeAll);
router.post("/reorder", requireAuth, requireRole(["admin"]), ctrl.reorder);

module.exports = router;
