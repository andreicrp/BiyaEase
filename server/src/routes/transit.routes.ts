import { Router } from 'express';
import {
  getTransitModes,
  getRoutes,
  getRouteById,
  getRouteStops,
  getRouteShape,
  getNearbyStops,
} from '../controllers/transit.controller.js';

const router = Router();

router.get('/modes', getTransitModes);
router.get('/routes', getRoutes);
router.get('/routes/:id', getRouteById);
router.get('/routes/:id/stops', getRouteStops);
router.get('/routes/:id/shape', getRouteShape);
router.get('/stops/nearby', getNearbyStops);

export default router;
