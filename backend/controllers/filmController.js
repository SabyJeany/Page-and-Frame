import { searchFilms, getFilmById, getCollectionById } from '../services/tmdbService.js'; // Import the service that searches films (cache + TMDB)

export async function getById(req, res) {
    const id = Number(req.params.id);

    if (!Number .isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        const film = await getFilmById(id);
        if (!film) {
            return res.status(404).json({ message: 'Film introuvable' });
        }
        res.json(film);
    }   catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

/**
 * Controller for GET /api/films/search?q=...
 * Checks the search text, then returns the matching films.
 *
 * @param {Object} req - The request (the search text is in req.query.q)
 * @param {Object} res - The response sent back to the front
 * @returns {Promise<Object>} JSON list of films, or an error message
 */
export async function search(req, res) {
    // Read "q" from the URL and remove spaces at the start and end
    // ?. avoids a crash if q is missing (returns undefined instead)
    const q = req.query.q?.trim();

    // Empty or missing search: send a 400 error (bad request)
    if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        // Call the service: it checks the cache, then TMDB if needed
        const films = await searchFilms(q);
        // Success: send the simplified list of films
        return res.status(200).json(films);
    } catch (error) {
        // Unexpected error (e.g. TMDB down): log it on the server
        console.error(error);
        // Send a generic message, without technical details
        return res.status(500).json({ message: 'Server error' });
    }
}
export async function getCollection(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        const collection = await getCollectionById(id);
        if (!collection) {
            return res.status(404).json({ message: 'Saga introuvable' });
        }
        res.json(collection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}