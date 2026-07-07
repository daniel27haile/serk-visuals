// routes/admin_pricing_config_routes.js
const router       = require("express").Router();
const ctrl         = require("../controller/pricing_config_controller");
const { requireAdmin } = require("../middleware/auth");

// Admin: list all configs
router.get("/", requireAdmin, ctrl.getAllConfigs);
// Admin: upsert config for a session type
router.put("/:sessionType", requireAdmin, ctrl.updateConfig);

module.exports = router;
