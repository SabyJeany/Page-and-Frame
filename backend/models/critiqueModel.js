import db from '../config/mysql.js';

export async function upsertCritique(idUtilisateur, idOeuvre, note, commentaire) {
    // The UNIQUE (id_utilisateur, id_oeuvre) constraint triggers the UPDATE part
    await db.execute(
        `INSERT INTO critique (note, commentaire, id_utilisateur, id_oeuvre)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            note = ?,
            commentaire = ?,
            date_critique = CURRENT_TIMESTAMP`,
        [note, commentaire, idUtilisateur, idOeuvre, note, commentaire]
    );
}
/**
 * Returns all reviews of a user, newest first.
*/
export async function findCritiquesByUser(idUtilisateur) {
    const [rows] = await db.execute(
        `SELECT c.note, c.commentaire, c.date_critique, o.type, o.id_externe
        FROM critique c
        JOIN oeuvre o ON o.id_oeuvre = c.id_oeuvre
        WHERE c.id_utilisateur = ?
        ORDER BY c.date_critique DESC`,
        [idUtilisateur]
    );
    return rows;
}
/**
 * Returns the number of reviews and the average rating of a work (all users).
 */
export async function findStatsByOeuvre(type, idExterne) {
    const [rows] = await db.execute(
        `SELECT COUNT(*) AS total, ROUND(AVG(c.note), 1) AS moyenne
         FROM critique c
         JOIN oeuvre o ON o.id_oeuvre = c.id_oeuvre
         WHERE o.type = ? AND o.id_externe = ?`,
        [type, idExterne]
    );
    return rows[0];
}

/**
 * Returns the reviews of a work, newest first, only from public profiles.
 */
export async function findCritiquesByOeuvre(type, idExterne) {
    const [rows] = await db.execute(
        `SELECT u.pseudo, u.avatar, c.note, c.commentaire, c.date_critique
         FROM critique c
         JOIN oeuvre o ON o.id_oeuvre = c.id_oeuvre
         JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
         WHERE o.type = ? AND o.id_externe = ? AND u.profil_public = TRUE
         ORDER BY c.date_critique DESC
         LIMIT 50`,
        [type, idExterne]
    );
    return rows;
}