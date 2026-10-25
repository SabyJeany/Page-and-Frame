// Import the two cache functions (read and write in MongoDB)
import { getCache, setCache } from './cacheService.js';

// Base URL of the TMDB API (version 3)
const TMDB_URL = 'https://api.themoviedb.org/3';

/**
 * Calls the TMDB API with the read token stored in .env.
 *
 * @param {string} path - The endpoint to call, e.g. "/search/movie?query=dune"
 * @returns {Promise<Object>} The JSON response from TMDB
 * @throws {Error} If TMDB answers with an error status
 */
async function tmdbFetch(path) {
    // Send the HTTP request to TMDB (base URL + path)
    const res = await fetch(`${TMDB_URL}${path}`, {
        headers: {
            // Authentication: the secret token from .env, never in the code
            Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
            // Ask TMDB to answer in JSON
            accept: 'application/json',
        },
    });
    // If the status is not 2xx (e.g. 401, 404, 500), stop with an error
    if (!res.ok) {
        throw new Error(`TMDB error ${res.status}`);
    }
    // Convert the response body to a JavaScript object
    return res.json();
}

/**
 * Searches films by title: checks the cache first, otherwise calls TMDB.
 *
 * @param {string} query - The text typed by the user, e.g. "Dune"
 * @returns {Promise<Array<Object>>} Simplified films: tmdbId, title, year, poster
 */
export async function searchFilms(query) {
    // Build the cache key in lowercase so "Dune" and "dune" share the same entry
    const key = `search:${query.toLowerCase()}`;
    // Look in the MongoDB cache first
    let data = await getCache(key);

    if (data) {
        // Found in cache: no need to call TMDB
        console.log(`⚡ Cache hit: ${key}`);
    } else {
        // Not in cache: call TMDB (encodeURIComponent makes the text safe for a URL)
        console.log(`🌐 TMDB call: ${key}`);
        data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&language=fr-FR`);
        // Save the raw response in the cache for next time
        await setCache(key, 'tmdb', data);
    }

    // Keep only what the front-end needs
    return data.results.map((film) => ({
        // TMDB id, used later to link with MySQL (ratings, watchlist...)
        tmdbId: film.id,
        // French title (thanks to language=fr-FR)
        title: film.title,
        // Keep only the year (first 4 characters of "2021-09-15"), or null if no date
        year: film.release_date ? film.release_date.slice(0, 4) : null,
        // Full poster URL (w342 = width in pixels), or null if no poster
        poster: film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null,
    }));
}