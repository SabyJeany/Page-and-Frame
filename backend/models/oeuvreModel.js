import db from '../config/mysql.js';

/**
 * finds a work (film or book) in MySQL, or creates it if it does not exist yet.
 * 
 * @param {string} type - 'film' or 'livre'
 * @param {string} id Extern TMDB id (film) or Open Library id (book)
 * @returns {Promise<number>} The id_oeuvre
 */
export async function findOrCreateOeuvre(type, idExterne) {

    // INSERT IGNORE: does nothing if the work already exists (UNIQUE(type, id_externe))
    await db.execute(

        'INSERT IGNORE INTO oeuvre (type, id_externe) VALUES (?, ?)',
        [type, idExterne]
    );
    const [rows] = await db.execute(
        'SELECT id_oeuvre FROM oeuvre WHERE type = ? AND id_externe = ?',
        [type, idExterne]
    );
    return rows[0].id_oeuvre;
}