// routes/pricing_config_routes.js
const router = require("express").Router();
const ctrl   = require("../controller/pricing_config_controller");

// Public: read config for a session type (used by booking form)
router.get("/:sessionType", ctrl.getConfig);

module.exports = router;
