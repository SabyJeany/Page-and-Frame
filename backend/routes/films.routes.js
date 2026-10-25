import { Router } from 'express';
import { search } from '../controllers/filmController.js';

/**
 * Router for all film routes.
 * Mounted in the main server file, e.g. app.use('/api/films', router),
 * so '/search' becomes '/api/films/search'.
 */
const router = Router();

router.get('/search', search);

export default router;