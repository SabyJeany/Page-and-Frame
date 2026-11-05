import bcrypt from 'bcrypt';

// Cost factor: bcrypt repeats its calculation 2^10 = 1024 times
// Slower to compute = much harder for an attacker to test millions of passwords

const SALT_ROUNDS = 10;

/**Hashes a password before saving it in the database (sign-up) 
 * bcrypt adds a random salt, so two identical passwords give two different hashes.
 * @param {string} password - The plain password typed by the user
 * @returns {Promise<string>} - The hashed password (60 characters) , stored  in the column "mot_de_passe" of the table "utilisateur"
 */

export function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
/**
 * Compares the typed password with the stored hash (login, account deletion).
 * The hash cannot be turned back into the password: bcrypt hashes the typed
 * password again with the same salt, then compares the two results.
 *
 * @param {string} password - The plain password typed by the user
 * @param {string} hash - The hash stored in the database
 * @returns {Promise<boolean>} true if the password is correct, false otherwise
 */

// Compare the typed password with the stored hash (login)
export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}