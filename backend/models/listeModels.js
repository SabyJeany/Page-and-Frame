import db from '../config/mysql.js'

/**
 * adds a work to the user's list, or updates its status if it is already there
 */

export async function upsertListe(idUtilisateur, idOeuvre, statut) {
    await db.execute(
        `INSERT INTO liste (statut, id_utilisateur, id_oeuvre)
        VALUES (?,?,?)
        ON DUPLICATE KEY UPDATE
        statut = ?,
        date_ajout = CURRENT_TIMESTAMP`,
        [statut, idUtilisateur, idOeuvre, statut]
    );
}

/**
 * Returns the user's list, newest first. The status filter is optional.
 */
export async function findListeByUser(idUtilisateur, statut) {
    let sql =  `SELECT l.statut, l.date_ajout, o.type, o.id_externe
               FROM liste l
               JOIN oeuvre o ON o.id_oeuvre = l.id_oeuvre
               WHERE l.id_utilisateur = ?`;
    const params = [idUtilisateur];

    if (statut) {
        sql += ' AND l.statut = ?';
        params.push(statut);
    }
    sql += ' ORDER BY l.date_ajout DESC';

    const [rows] = await db.execute(sql, params);
    return rows;
}

/**
 * removes a work from user's list.
 * @returns {Promise<boolean>} true if a row deleted 
 */
export async function deleteListe(idUtilisateur, type, idExterne) {
    const [result] = await db.execute(
        `DELETE l FROM liste l
        JOIN oeuvre o ON o.id_oeuvre = l.id_oeuvre
        WHERE l.id_utilisateur = ? AND o.type = ? AND o.id_externe = ?`,
        [idUtilisateur, type, idExterne]
    );
    return result.affectedRows > 0;
}