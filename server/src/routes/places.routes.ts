import { Router } from 'express';
import { getPlaces, searchPlaces, getNearbyPlaces } from '../controllers/places.controller.js';

const router = Router();

router.get('/', getPlaces);
router.get('/search', searchPlaces);
router.get('/nearby', getNearbyPlaces);

export default router;
