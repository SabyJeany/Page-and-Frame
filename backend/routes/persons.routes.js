import { Router } from 'express';
import { getPerson } from '../controllers/personController.js';

/**
 * Router for actors and directors.
 * Mounted in server.js with app.use('/api/persons', router).
 */
const router = Router();

router.get('/:id', getPerson);

export default router;