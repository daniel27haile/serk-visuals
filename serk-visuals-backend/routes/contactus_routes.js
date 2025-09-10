// routes/contact-us.routes.js
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("../controller/contactus_controller");


// 10 requests / 10 minutes per IP (tweak as needed)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", limiter, controller.create);
router.get("/health", (req, res) => res.json({ status: "ok" }));
router.get("/:id", controller.getOne);
router.get("/", controller.getAll);

module.exports = router;
