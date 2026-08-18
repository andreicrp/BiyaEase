import { Router } from 'express';
import { RootController } from '../controllers/root.controller.js';
import healthRoutes from './health.routes.js';
import transitRoutes from './transit.routes.js';
import placesRoutes from './places.routes.js';
import searchRoutes from './search.routes.js';
import routingRoutes from './routing.routes.js';
import authRoutes from './auth.routes.js';
import savedDataRoutes from './savedData.routes.js';
import reportsRoutes from './reports.routes.js';
import adminRoutes from './admin.routes.js';
import gtfsAdminRoutes from './gtfsAdmin.routes.js';
import vehicleRoutes from './vehicle.routes.js';

const router = Router();

// Root route
router.get('/', RootController.getRoot);

// Sub-routes
router.use('/api/health', healthRoutes);
router.use('/api/transit/vehicles', vehicleRoutes);
router.use('/api/transit', transitRoutes);
router.use('/api/places', placesRoutes);
router.use('/api/search', searchRoutes);
router.use('/api/routes', routingRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/saved', savedDataRoutes);
router.use('/api/reports', reportsRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/admin/gtfs', gtfsAdminRoutes);

export default router;
