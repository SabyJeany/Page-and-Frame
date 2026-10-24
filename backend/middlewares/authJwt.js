import {verifyToken} from '../utils/jwt.js';

// Block th request if the token is missing or invalid 
export function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header (Bearer <token>)
    if (!token) {
        return res.status(401).json({ message: 'Please log in' });
    }

    try {
        req.user = verifyToken(token); // {id, role 'iat, exp'}
        next(); // Token is valid, proceed to the next middleware or route handler
    } catch  {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}