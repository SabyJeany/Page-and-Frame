import jwt from 'jsonwebtoken';
// This line imports the jsonwebtoken library into your file, to create and verify JWT tokens.


const SECRET = process.env.JWT_SECRET; // GET the secret key from environment variables for signing the token.

// Stop the app if the secret is missing (never use a default secret)
if (!SECRET) {
    throw new Error('JWT_SECRET is missing in .env');
}

// Create a token containing the user id and role, valid 24h
export function createToken(user) {
    return jwt.sign({ id: user.id_utilisateur, role: user.role }, SECRET, { expiresIn: '24h' });
}

// Return the token content or throw an error if invalid/expired
export function verifyToken(token) {
    return jwt.verify(token, SECRET);
}