import { findOrCreateOeuvre } from '../models/oeuvreModel.js';
import {upsertListe, findListeByUser, deleteListe} from '../models/listeModels.js';
import { getFilmById } from '../services/tmdbService.js';
import { getBookById } from '../services/openLibraryService.js';

//Allowed statues for each type of work (MySQL cannot check this itself)
const STATUTS = {
    film: ['a_voir', 'vu'],
    livre: ['a_lire', 'lu']
};

//Checks the external id format: digits for a film, "ol...w" for a book
function isValidId(type, id) {
    return type === 'film' ? /^[1-9]\d*$/.test(id) : /^OL\d+W$/.test(id);
}
/**
 * Controller for POST /api/lists (protected)
 * Body: { type: "film" | "livre", idExterne: "438631", statut: "a_voir" }
 */
export async function addToList(req, res) {
    const { type, idExterne, statut } = req.body;
    const id = String(idExterne ?? '');

    if (!STATUTS[type]) {
        return res.status(400).json({ message: 'Invalid type (film or livre)' });
    }
    if (!isValidId(type, id)) {
        return res.status(400).json({ message: 'Invalid identifier' });
    }
    if (!STATUTS[type].includes(statut)) {
        return res.status(400).json({ message: `Invalid status for a ${type}: ${STATUTS[type].join(' or ')}` });
    }

    try {
        const oeuvre = type === 'film' ? await getFilmById(Number(id)) : await getBookById(id);
        if (!oeuvre) {
            return res.status(404).json({ message: 'Work not found' });
        }

        const idOeuvre = await findOrCreateOeuvre(type, id);
        await upsertListe(req.user.id, idOeuvre, statut);

        res.status(200).json({ message: 'List updated', type, idExterne: id, statut });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

/**
 * Controller for GET /api/lists/me?statut=a_voir (protected)
 */
export async function myList(req, res) {
    const { statut } = req.query;
    const tousLesStatuts = [...STATUTS.film, ...STATUTS.livre];

    if (statut && !tousLesStatuts.includes(statut)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const liste = await findListeByUser(req.user.id, statut);
        res.json(liste);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

/**
 * Controller for DELETE /api/lists/:type/:idExterne (protected)
 */
export async function removeFromList(req, res) {
    const { type, idExterne } = req.params;

    if (!STATUTS[type] || !isValidId(type, idExterne)) {
        return res.status(400).json({ message: 'Invalid type or identifier' });
    }

    try {
        const deleted = await deleteListe(req.user.id, type, idExterne);
        if (!deleted) {
            return res.status(404).json({ message: 'This work is not in your list' });
        }
        res.status(204).send(); // 204 = success, nothing to send back
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}