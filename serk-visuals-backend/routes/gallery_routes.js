const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controller/gallery_controller");
const { upload } = require("../config/upload");

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

// list + read
router.get("/getAll", ctrl.list);
router.get("/:id", validateId, ctrl.getOne);

// create (multipart)
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 }, // required
    { name: "thumb", maxCount: 1 }, // optional
  ]),
  ctrl.create
);

// update (multipart optional)
router.patch(
  "/:id",
  validateId,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrl.update
);

// delete
router.delete("/:id", validateId, ctrl.remove);
// delete all
router.delete("/", ctrl.removeAll);

module.exports = router;
