import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Optional Auth Endpoint for viewing nearby reports
router.get('/nearby', optionalAuth, (req, res) => reportsController.getNearby(req, res));
router.get('/:id', optionalAuth, (req, res) => reportsController.getById(req, res));

// Protected Endpoints requiring authentication
router.post('/', requireAuth, (req, res) => reportsController.createReport(req, res));
router.post('/:id/confirm', requireAuth, (req, res) => reportsController.confirmReport(req, res));
router.post('/:id/dismiss', requireAuth, (req, res) => reportsController.dismissReport(req, res));
router.delete('/:id', requireAuth, (req, res) => reportsController.deleteReport(req, res));

export default router;
