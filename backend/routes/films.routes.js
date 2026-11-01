import { Router } from 'express';
import { search, getById, getCollection, getRecommendations, getOrigin } from '../controllers/filmController.js';

/**
 * Router for all film routes.
 * Mounted in the main server file, e.g. app.use('/api/films', router),
 * so '/search' becomes '/api/films/search'.
 */
const router = Router();

router.get('/search', search);
router.get('/collection/:id', getCollection);
router.get('/:id/recommendations', getRecommendations);
router.get('/:id', getById);
router.get('/:id/origin', getOrigin);
export default router;