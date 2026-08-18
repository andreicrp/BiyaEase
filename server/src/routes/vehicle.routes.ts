import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller.js';

const router = Router();

// Public vehicle positions endpoints (GPS telemetry updates and client query radar)
router.post('/update', (req, res) => vehicleController.updatePosition(req, res));
router.get('/nearby', (req, res) => vehicleController.getNearby(req, res));

export default router;
