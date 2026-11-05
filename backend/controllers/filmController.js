import { searchFilms, getFilmById, getCollectionById, getRecommendationsById } from '../services/tmdbService.js'; // Import the service that searches films (cache + TMDB)
import { getFilmOrigin } from '../services/wikidataService.js';

/**
 * Controller for GET /api/films/:id (public)
 * Returns the full details of a film (title, poster, cast, directors...).
 *
 * @param {Object} req - The request of the client (the film id is in req.params.id)
 * @param {Object} res - The response of the serveur
 * @returns {Promise<Object>} The film, or an error
 */

export async function getById(req, res) {
    // Read the id from the URL (text) and convert it to a number
    const id = Number(req.params.id);

    // The id must be a positive integer, otherwise 400 (client error)
    if (!Number .isInteger(id) || id <= 0) {                     // !Number.isInteger(id) means ‘if it is not an integer’
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        const film = await getFilmById(id); // Search the film in the cache TMDB if not in TMDB 
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
    const q = req.query.q?.trim();              // Reads the search text from the URL and stores it in the constant q

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
    // Read the saga id from the URL and convert it to a number
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

/**
 * Controller for GET /api/films/:id/origin
 * Returns the book(s) or work(s) the film is based on.
 *
 * @param {Object} req - The request (the film id is in req.params.id)
 * @param {Object} res - The response sent back to the front
 * @returns {Promise<Object>} JSON with the film id, its title and its origins
 */
export async function getOrigin(req, res) {
    // Read the id from the URL and convert it from text to a number
    const id = Number(req.params.id);

    // The id must be a positive integer, otherwise 400 (client error)
    if (!Number.isInteger(id) || id <= 0) {                          // : !Number.isInteger(id) means ‘if it is not an integer’
        return res.status(400).json({ message: 'Invalid identifier' });
    }

    try {
        // Check that the film really exists on TMDB (cache first)
        const film = await getFilmById(id);
        // Unknown film: 404
        if (!film) {
            return res.status(404).json({ message: 'Film not found' });
        }

        // Find the origins of the film (Wikidata + Open Library)
        const origins = await getFilmOrigin(id);

        // Send the id, the title and the origins (empty list if original screenplay)
        res.json({ tmdbId: id, title: film.title, origins });
    } catch (error) {
        // Unexpected error (Wikidata down...): log it, send a generic message
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}
export async function getRecommendations(req, res) {
    // Read the id from the URL and convert it to a number
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {   // : !Number.isInteger(id) means ‘if it is not an integer’
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        const films = await getRecommendationsById(id);
        if (!films) {
            return res.status(404).json({ message: 'Film introuvable' });
        }
        res.json(films);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}