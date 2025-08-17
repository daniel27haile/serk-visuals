const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controller/booking_controller");

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid booking id" });
  }
  next();
};

router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.get("/:id", validateId, ctrl.getOne);
router.patch("/:id", validateId, ctrl.update);
router.patch("/:id/status", validateId, ctrl.setStatus);
router.delete("/:id", validateId, ctrl.remove);

module.exports = router;
