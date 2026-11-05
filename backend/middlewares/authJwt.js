import {verifyToken} from '../utils/jwt.js';

/**
 * Middleware: blocks the request if the token is missing or invalid.
 * Placed before a controller in a route, e.g. router.get('/me', requireAuth, me).
 * 
 * @param {Object} req - The request who the front sent sent to the server, with headers, body, etc.  
 * @param {Object} res - The response (used only to send a 401 error)
 * @param {Function} next - Lets the request continue to the controller
 */
export function requireAuth(req, res, next) {
    // Split at the space and keep the 2nd part.
    // ?. avoids a crash if the header is missing
    const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header (Bearer <token>)
    if (!token) { // No token: the user is not logged in → 401
        return res.status(401).json({ message: 'Please log in' });
    }
    
    // try = 
    try {
        req.user = verifyToken(token); // {id, role 'iat, exp'}
        next(); // Indicates to Express that the token has been successfully verified and passes control to the middleware or the next controller.
    } catch  {
        // If `verifyToken(token)` fails (token has expired, invalid signature, corrupted string), it raises an error
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}