import { Router } from 'express';
import { getAuthor, getAdaptations } from '../controllers/authorController.js';

/**
 * Router for authors (Open Library).
 * Mounted in server.js with app.use('/api/authors', router).
 */
const router = Router();

router.get('/:id', getAuthor);
router.get('/:id/adaptations', getAdaptations);

export default router;