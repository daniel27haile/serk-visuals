// routes/booking_routes.js
const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controller/booking_controller");

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid booking id" });
  }
  next();
};

// Quick assertion to catch missing handlers early in dev
[
  "getStats",
  "getAll",
  "getOne",
  "create",
  "update",
  "setStatus",
  "bulkStatus",
  "bulkDelete",
  "remove",
  "exportCsv",
].forEach((k) => {
  if (typeof ctrl[k] !== "function") {
    throw new Error(`Controller "${k}" is not a function`);
  }
});

/** Stats & export */
router.get("/stats", ctrl.getStats);
router.get("/export.csv", ctrl.exportCsv);

/** Bulk ops */
router.patch("/bulk/status", ctrl.bulkStatus);
router.delete("/bulk", ctrl.bulkDelete);

/** CRUD */
router.get("/", ctrl.getAll); // GET /api/bookings
router.get("/getAll", ctrl.getAll); // optional alias
router.post("/", ctrl.create); // POST /api/bookings
router.get("/:id", validateId, ctrl.getOne);
router.patch("/:id", validateId, ctrl.update);
router.patch("/:id/status", validateId, ctrl.setStatus);
router.delete("/:id", validateId, ctrl.remove);

module.exports = router;
