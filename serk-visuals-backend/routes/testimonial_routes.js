const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controller/testimonial_controller");
const { uploadTestimonial } = require("../config/upload_testimonials");

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

router.get("/", ctrl.list);
router.get("/:id", validateId, ctrl.getOne);

router.post("/", uploadTestimonial.single("avatar"), ctrl.create);

router.patch(
  "/:id",
  validateId,
  uploadTestimonial.single("avatar"),
  ctrl.update
);

router.delete("/:id", validateId, ctrl.remove);
router.delete("/", ctrl.removeAll);

module.exports = router;
