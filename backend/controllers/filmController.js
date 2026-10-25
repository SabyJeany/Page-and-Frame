// Import the service that searches films (cache + TMDB)
import { searchFilms } from '../services/tmdbService.js';

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