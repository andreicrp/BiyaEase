import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';

const router = Router();

// GET /api/search?q={query}&lat={lat}&lng={lng}&radius={radius}&limit={limit}
router.get('/', SearchController.search);

export default router;
