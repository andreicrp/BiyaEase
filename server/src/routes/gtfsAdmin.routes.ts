import { Router } from 'express';
import { gtfsAdminController } from '../controllers/gtfsAdmin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/agencies', (req, res) => gtfsAdminController.getAgencies(req, res));
router.get('/routes', (req, res) => gtfsAdminController.getRoutes(req, res));
router.post('/routes', (req, res) => gtfsAdminController.saveRoute(req, res));
router.delete('/routes/:id', (req, res) => gtfsAdminController.deleteRoute(req, res));
router.get('/stops', (req, res) => gtfsAdminController.getStops(req, res));
router.post('/stops', (req, res) => gtfsAdminController.saveStop(req, res));
router.delete('/stops/:id', (req, res) => gtfsAdminController.deleteStop(req, res));

export default router;
