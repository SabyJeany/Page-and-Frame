import { findOrCreateOeuvre } from '../models/oeuvreModel.js';
import { upsertCritique, findCritiquesByUser } from '../models/critiqueModel.js';
import { getFilmById } from '../services/tmdbService.js';
import { getBookById } from '../services/openLibraryService.js';

/**
 * Controller for POST /api/reviews (protected)
 * Body: { type: "film" | "livre", idExterne: "438631", note: 1-5, commentaire?: "..." }
 */
export async function rate(req, res) {
    const { type, idExterne, note, commentaire } = req.body;

    // 1. Validate every input before touching the database
    if (type !== 'film' && type !== 'livre') {
        return res.status(400).json({ message: 'Invalid type (film or livre)' });
    }
    const id = String(idExterne ?? '');
    const idValide = type === 'film' ? /^[1-9]\d*$/.test(id) : /^OL\d+W$/.test(id);
    if (!idValide) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    if (!Number.isInteger(note) || note < 1 || note > 5) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    if (commentaire !== undefined && (typeof commentaire !== 'string' || commentaire.length > 2000)) {
        return res.status(400).json({ message: 'Invalid comment (2000 characters max))' });
    }

    try {
        // 2. Check that the work really exists (avoids storing fake ids)
        const oeuvre = type === 'film' ? await getFilmById(Number(id)) : await getBookById(id);
        if (!oeuvre) {
            return res.status(404).json({ message: 'work not found' });
        }

        // 3. Save: find or create the work, then create or update the review
        const idOeuvre = await findOrCreateOeuvre(type, id);
        await upsertCritique(req.user.id, idOeuvre, note, commentaire?.trim() || null);

        res.status(200).json({ message: 'Rating saved', type, idExterne: id, note });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error servor' });
    }
}

/**
 * Controller for GET /api/reviews/me (protected)
 */
export async function myReviews(req, res) {
    try {
        const critiques = await findCritiquesByUser(req.user.id);
        res.json(critiques);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}