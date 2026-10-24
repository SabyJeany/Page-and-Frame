// Import the Router function from Express to create a group of routes
import { Router,} from 'express';
import { register, login, me } from '../controllers/authController.js'; // Import the register controller (contains the sign-up logic)
import {requireAuth} from '../middlewares/authJwt.js'; // Import the requireAuth middleware to protect routes


const router = Router();

// POST /api/auth/register → calls the register controller to create a new user
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

// Export the router so the main server file (app.js / server.js) can use it
export default router;