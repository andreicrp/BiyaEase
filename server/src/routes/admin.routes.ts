import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = Router();

// Enforce both JWT authentication and Admin privileges
router.use(requireAuth);
router.use(requireAdmin);

router.get('/metrics', (req, res) => adminController.getMetrics(req, res));
router.get('/reports', (req, res) => adminController.getReports(req, res));
router.post('/reports/:id/action', (req, res) => adminController.moderateReport(req, res));
router.get('/users', (req, res) => adminController.getUsers(req, res));
router.post('/users/:id/admin', (req, res) => adminController.setUserAdmin(req, res));

export default router;
