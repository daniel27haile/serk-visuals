// routes/project_routes.js
const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controller/project_controller");
const { requireAuth, requireRole } = require("../middleware/auth");

// Admin-only
router.use(requireAuth, requireRole(["admin"]));

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

// List + read
router.get("/", ctrl.getAll);
router.get("/:id", validateId, ctrl.getOne);

// Create/Update now expect JSON with S3 keys
router.post("/", ctrl.create);
router.patch("/:id", validateId, ctrl.update);

// Status + delete
router.patch("/:id/status", validateId, ctrl.updateStatus);
router.delete("/:id", validateId, ctrl.softDelete);
router.delete("/:id/hard", validateId, ctrl.hardDelete);

module.exports = router;
