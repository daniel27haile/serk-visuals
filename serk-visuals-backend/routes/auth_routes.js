// routes/auth_routes.js
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controller/auth_controller");

router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", ctrl.me); // lightweight; doesn't 401 if missing, just returns {user:null}
router.get("/me/secure", requireAuth, ctrl.me); // optional: 401 when missing

module.exports = router;
