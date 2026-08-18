import { Router } from 'express';
import { routingController } from '../controllers/routing.controller.js';

const router = Router();

// POST /api/routes/search - Calculate multimodal routes
router.post('/search', (req, res, next) => routingController.searchRoutes(req, res, next));

export default router;
