import { Router } from 'express';
import { requireAuth } from '../middlewares/authJwt.js';
import { addToList, myList, removeFromList } from '../controllers/listController.js';

/**
 * Router for the user's lists (films to watch, books to read...). Every route needs a valid JWT.
 * Mounted in server.js with app.use('/api/lists', router).
 */
const router = Router();

router.post('/', requireAuth, addToList);
router.get('/me', requireAuth, myList);
router.delete('/:type/:idExterne', requireAuth, removeFromList);

export default router;