// routes/admin_re_portfolio_routes.js
// Admin-only portfolio management routes
const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const ctrl = require('../controller/re_portfolio_controller');

// Project-level operations
router.get('/',    requireAdmin, ctrl.adminList);
router.post('/',   requireAdmin, ctrl.adminCreate);

// Bulk reorder (must come BEFORE /:id to avoid matching 'reorder' as an id)
router.patch('/reorder', requireAdmin, ctrl.adminReorderProjects);

router.get('/:id',    requireAdmin, ctrl.adminGet);
router.patch('/:id',  requireAdmin, ctrl.adminUpdate);
router.delete('/:id', requireAdmin, ctrl.adminDelete);

// Image management within a project
router.post('/:id/images',                        requireAdmin, ctrl.adminAddImage);
router.delete('/:id/images/:imgId',               requireAdmin, ctrl.adminRemoveImage);
router.patch('/:id/images/reorder',               requireAdmin, ctrl.adminReorderImages);

module.exports = router;
