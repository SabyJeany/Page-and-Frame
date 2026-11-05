import { findOrCreateOeuvre } from '../models/oeuvreModel.js';
import { upsertCritique, findCritiquesByUser, findStatsByOeuvre, findCritiquesByOeuvre } from '../models/critiqueModel.js';
import { getFilmById } from '../services/tmdbService.js';
import { getBookById } from '../services/openLibraryService.js';


/**
 * Controller for POST /api/reviews (protected)
 * Body: { type: "film" | "livre", idExterne: "438631", note: 1-5, commentaire?: "..." }
 */
export async function rate(req, res) {
    const { type, idExterne, note, commentaire } = req.body; //

    // 1. Validate every input before touching the database
    if (type !== 'film' && type !== 'livre') {
        return res.status(400).json({ message: 'Invalid type (film or livre)' });
    }
    const id = String(idExterne ?? '');
    const idValide = type === 'film' ? /^[1-9]\d*$/.test(id) : /^OL\d+W$/.test(id); // It checks the format of the identifier and stores the result – true or false – in idValide
    if (!idValide) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    if (!Number.isInteger(note) || note < 1 || note > 5) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    if (commentaire !== undefined && (typeof commentaire !== 'string' || commentaire.length > 2000)) {
        // If a comment has been submitted, and it is not text or is too long, then a 400 error is returned.
        // If there is no character, nothing is checked 
        return res.status(400).json({ message: 'Invalid comment (2000 characters max))' });
    }

    try {
        // 2. Check that the work really exists on TMDB or OpenLibrary
        const oeuvre = type === 'film' ? await getFilmById(Number(id)) : await getBookById(id);
        if (!oeuvre) {
            return res.status(404).json({ message: 'work not found' });
        }

        /**  3. Save: find or create the work, then create or update the review
         * The question mark prevents a crash if there is no comment
         * trim removes spaces around the text
         * If the comment is empty, store null instead
         */
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
    try {                                  // try = Statement
        const critiques = await findCritiquesByUser(req.user.id);
        res.json(critiques); // The ‘critiques’ constant awaits the result of `findCritiquesByUser`, which searches MySQL for all reviews by the logged-in user
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

/**
 * Controller for GET /api/reviews/:type/:idExterne (public)
 * Returns the average rating, the number of reviews and the public reviews of a work.
 */
export async function getWorkReviews(req, res) {
    const { type, idExterne } = req.params;

    if (type !== 'film' && type !== 'livre') {
        return res.status(400).json({ message: 'Invalid type (film or livre)' });
    }
    const idValide = type === 'film' ? /^[1-9]\d*$/.test(idExterne) : /^OL\d+W$/.test(idExterne);
    if (!idValide) {
        return res.status(400).json({ message: 'Invalid identifier' });
    }

    try {
        // Both queries run at the same time
        const [stats, reviews] = await Promise.all([ // Promise.all runs both requests in parallel
            findStatsByOeuvre(type, idExterne), // Calculates the number of reviews and the average
            findCritiquesByOeuvre(type, idExterne) // Is the subject of public criticism.
        ]);

        res.json({  // Returns an object
            type,
            idExterne,
            total: stats.total,
            // This line converts the average to a number, unless there isn’t one
            // Number(stats.average) converts it to a number. MySQL returns the average as number, e.g. (4.5)
            moyenne: stats.moyenne !== null ? Number(stats.moyenne) : null, 
            reviews
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}