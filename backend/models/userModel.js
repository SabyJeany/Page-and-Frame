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