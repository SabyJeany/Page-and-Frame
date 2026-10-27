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