import { Router } from 'express';
import { requireAuth } from '../middlewares/authJwt.js';
import { rate, myReviews } from '../controllers/reviewController.js';

/**
 * Router for reviews (ratings). Every route needs a valid JWT.
 * Mounted in server.js with app.use('/api/reviews', router).
 */
const router = Router();

router.post('/', requireAuth, rate);
router.get('/me', requireAuth, myReviews);

export default router;