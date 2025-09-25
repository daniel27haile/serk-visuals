// routes/project_routes.js
const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controller/project_controller");
const  uploadProjects  = require("../config/upload_projects");
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

// Create (multipart)
router.post(
  "/",
  uploadProjects.fields([
    { name: "cover", maxCount: 1 }, // required
    { name: "thumb", maxCount: 1 }, // optional
  ]),
  ctrl.create
);

// Update (multipart optional)
router.patch(
  "/:id",
  validateId,
  uploadProjects.fields([
    { name: "cover", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrl.update
);

// Status + delete
router.patch("/:id/status", validateId, ctrl.updateStatus);
router.delete("/:id", validateId, ctrl.softDelete);
router.delete("/:id/hard", validateId, ctrl.hardDelete);

module.exports = router;
