// Import the Router function from Express to create a group of routes
import { Router } from 'express';

// Import the register controller (contains the sign-up logic)
import { register } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register → calls the register controller to create a new user
router.post('/register', register);

// Export the router so the main server file (app.js / server.js) can use it
export default router;