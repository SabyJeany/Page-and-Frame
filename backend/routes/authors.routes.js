import { Router } from 'express';
import { getAuthor } from '../controllers/authorController.js';

/**
 * Router for authors (Open Library).
 * Mounted in server.js with app.use('/api/authors', router).
 */
const router = Router();

router.get('/:id', getAuthor);

export default router;