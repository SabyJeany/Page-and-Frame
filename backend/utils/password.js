import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hash the password before saving it in the database
export function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare the typed password with the stored hash (login)
export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}