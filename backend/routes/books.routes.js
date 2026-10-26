import { Router } from 'express';
import { search, getById } from '../controllers/bookController.js';

/**
 * Router for all book routes.
 * Mounted in server.js with app.use('/api/books', router).
 */
const router = Router();

router.get('/search', search);
router.get('/:id', getById);

export default router;