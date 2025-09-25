// routes/gallery_routes.js
const express = require("express");
const { upload } = require("../config/upload");
const ctrl = require("../controller/gallery_controller");

const router = express.Router();

router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrl.create
);

router.patch(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrl.update
);

router.delete("/:id", ctrl.remove);
router.delete("/", ctrl.removeAll);
router.post("/reorder", ctrl.reorder);

module.exports = router;
