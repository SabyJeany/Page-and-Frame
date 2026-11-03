// Import the MySQL connection pool configured in config/mysql.js
import db from '../config/mysql.js';

/**
 * Creates a new user in the "utilisateur" table.
 * @param {Object} pseudo - The user's unique username.
 * @param {Object} email - The user's  email address.
 * @param {Object} hashedPassword - The password already hashed with bcrypt. (never store plain text passwords)
 * @returns {Promise<number>} The id of the newly created user
 */

export async function createUser(pseudo, email, hashedPassword) {
// Run the SQL query; db.execute returns [result, fields], we only keep result
    const [result] = await db.execute('INSERT INTO utilisateur (pseudo, email, mot_de_passe) VALUES (?, ?, ?)', 
    // Values sent separately : MySQL treats the as data, never as SQL code    
    [pseudo, email, hashedPassword]);

    return result.insertId;
}

// Find a user by email, (prepared statement )
export async function findUserByEmail(email ) {
    const[rows] = await db.execute(
        'SELECT id_utilisateur, pseudo , mot_de_passe, role FROM utilisateur WHERE email = ?', [email]);
    return rows[0]; // Return the first row (or undefined if not found)
}
// Find a user by id, without the the password
export async function findUserById(id) {
    const[rows] = await db.execute(
        'SELECT id_utilisateur, pseudo, avatar, bio, profil_public FROM utilisateur WHERE id_utilisateur = ?', [id]);
    return rows[0]; // Return the first row (or undefined if not found)
}

// Added: the only columns a user is allowed to update
const COLONNES_AUTORISEES = ['pseudo', 'email', 'mot_de_passe', 'avatar', 'bio', 'profil_public'];

/**
 * Updates some columns of a user.
 * Column names are checked against a fixed whitelist, never taken as is from the user.
 *
 * @param {number} idUtilisateur - The id of the user to update
 * @param {Object} champs - Columns and new values, e.g. { pseudo: 'jeany', bio: '...' }
 * @returns {Promise<void>}
 * @throws {Error} If a column is not allowed
 */
export async function updateUser(idUtilisateur, champs) {
    // Get the column names, e.g. ['pseudo', 'bio']
    const colonnes = Object.keys(champs);
    // Nothing to update: stop here
    if (colonnes.length === 0) return;

    // Added: second safety net, refuse any column outside the whitelist
    for (const colonne of colonnes) {
        if (!COLONNES_AUTORISEES.includes(colonne)) {
            throw new Error(`Column not allowed: ${colonne}`);
        }
    }

    // Build the SET part: "pseudo = ?, bio = ?"
    const set = colonnes.map(colonne => `${colonne} = ?`).join(', ');
    // Values go in the ? placeholders, the user id goes in the last one
    await db.execute(
        `UPDATE utilisateur SET ${set} WHERE id_utilisateur = ?`,
        [...Object.values(champs), idUtilisateur]
    );
}

/**
 * Returns the password hash of a user (used to confirm a deletion with bcrypt.compare).
 *
 * @param {number} idUtilisateur - The id of the user
 * @returns {Promise<string|null>} The bcrypt hash, or null if the user does not exist
 */
export async function findPasswordById(idUtilisateur) {
    const [rows] = await db.execute(
        'SELECT mot_de_passe FROM utilisateur WHERE id_utilisateur = ?',
        [idUtilisateur]
    );
    // ?. avoids a crash if no row was found
    return rows[0]?.mot_de_passe || null;
}

/**
 * Deletes a user. ON DELETE CASCADE also deletes their reviews, lists and follows.
 *
 * @param {number} idUtilisateur - The id of the user to delete
 * @returns {Promise<boolean>} true if a user was deleted, false otherwise
 */
export async function deleteUser(idUtilisateur) {
    const [result] = await db.execute(
        'DELETE FROM utilisateur WHERE id_utilisateur = ?',
        [idUtilisateur]
    );
    // affectedRows = number of deleted rows (1 if found, 0 if not)
    return result.affectedRows > 0;
}