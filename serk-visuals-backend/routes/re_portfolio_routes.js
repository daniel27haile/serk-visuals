// routes/re_portfolio_routes.js
// Public portfolio routes — no auth required
const router = require('express').Router();
const { publicCache } = require('../middleware/cache');
const ctrl = require('../controller/re_portfolio_controller');

router.get('/', publicCache(300, 600), ctrl.listPublic);
router.get('/:slug', publicCache(300, 600), ctrl.getBySlug);

module.exports = router;
