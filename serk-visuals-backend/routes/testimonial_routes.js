// routes/testimonial_routes.js
const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controller/testimonial_controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

router.get("/", ctrl.list);
router.get("/:id", validateId, ctrl.getOne);

// Admin-only mutations
router.post("/", requireAuth, requireRole(["admin"]), ctrl.create);
router.patch(
  "/:id",
  requireAuth,
  requireRole(["admin"]),
  validateId,
  ctrl.update
);
router.delete(
  "/:id",
  requireAuth,
  requireRole(["admin"]),
  validateId,
  ctrl.remove
);
router.delete("/", requireAuth, requireRole(["admin"]), ctrl.removeAll);

module.exports = router;
