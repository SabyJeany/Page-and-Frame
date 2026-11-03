import { Router } from 'express';
import { search, getById, getAdaptations } from '../controllers/bookController.js';

/**
 * Router for all book routes.
 * Mounted in server.js with app.use('/api/books', router).
 */
const router = Router();

router.get('/search', search);
router.get('/:id', getById);
router.get('/:id/adaptations', getAdaptations);
export default router;