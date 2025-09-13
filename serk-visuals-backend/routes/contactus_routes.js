// routes/contactus_routes.js
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("../controller/contactus_controller");
const { requireAuth, requireRole } = require("../middleware/auth");

// Public health + create
router.get("/health", (_req, res) => res.json({ status: "ok" }));
router.post(
  "/",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  controller.create
);

// 🛡️ Admin-only from here
router.use(requireAuth, requireRole(["admin", "editor"]));

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.patch("/:id", controller.update);
router.patch("/:id/status", controller.updateStatus);
router.delete("/:id", controller.softDelete);
router.delete("/:id/hard", controller.hardDelete);

module.exports = router;
