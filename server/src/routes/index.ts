import { Router } from 'express';
import { RootController } from '../controllers/root.controller.js';
import healthRoutes from './health.routes.js';
import transitRoutes from './transit.routes.js';
import placesRoutes from './places.routes.js';

const router = Router();

// Root route
router.get('/', RootController.getRoot);

// Sub-routes
router.use('/api/health', healthRoutes);
router.use('/api/transit', transitRoutes);
router.use('/api/places', placesRoutes);

export default router;
