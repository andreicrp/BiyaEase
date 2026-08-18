import { Router } from 'express';
import { savedDataController } from '../controllers/savedData.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Require authentication for all remote saved places & favorite routes endpoints
router.use(requireAuth);

// Saved Places Endpoints
router.get('/places', (req, res) => savedDataController.getSavedPlaces(req, res));
router.post('/places', (req, res) => savedDataController.savePlace(req, res));
router.delete('/places/:id', (req, res) => savedDataController.deletePlace(req, res));
router.post('/places/sync', (req, res) => savedDataController.syncPlaces(req, res));

// Favorite Routes Endpoints
router.get('/routes', (req, res) => savedDataController.getFavoriteRoutes(req, res));
router.post('/routes', (req, res) => savedDataController.saveFavoriteRoute(req, res));
router.delete('/routes/:id', (req, res) => savedDataController.deleteFavoriteRoute(req, res));
router.post('/routes/sync', (req, res) => savedDataController.syncRoutes(req, res));

export default router;
