import { Router } from 'express';
import { requireAuth } from '../middlewares/authJwt.js';
import { updateProfile, deleteAccount } from '../controllers/userController.js';

/**
 * Router for the connected user's account. Every route needs a valid JWT.
 * Mounted in server.js with app.use('/api/users', router).
 */
const router = Router();

router.patch('/me', requireAuth, updateProfile);
router.delete('/me', requireAuth, deleteAccount);

export default router;