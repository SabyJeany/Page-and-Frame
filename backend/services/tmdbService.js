// Import the two cache functions (read and write in MongoDB)
import { getCache, setCache } from './cacheService.js';

const TMDB_URL = 'https://api.themoviedb.org/3'; // The TMDB_URL constant stores the base address of the TMDB API (version 3)

/**
 * Calls the TMDB API with the read token stored in .env.
 * Internal function (not exported): only used inside this file.
 *
 * @param {string} path - The endpoint to call, e.g. "/search/movie?query=dune"
 * @returns {Promise<Object>} The JSON response from TMDB
 * @throws {Error} If TMDB answers with an error status
 */
async function tmdbFetch(path) {
    // Send the HTTP request to TMDB (base URL + path)
    const res = await fetch(`${TMDB_URL}${path}`, { // The res constant waits for TMDB's response to the request
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
    // Cache key in lowercase, so "Dune" and "dune" share the same entry
    const key = `search:${query.toLowerCase()}`; // The key constant generates the cache key using the search text, in lowercase
    // Look in the MongoDB cache first
    let data = await getCache(key); // The data variable waits for the cached results (or TMDB's results if not in cache)

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
        tmdbId: film.id,                                                   // TMDB id, link with MySQL
        title: film.title,                                                 // French title (language=fr-FR)
        year: film.release_date ? film.release_date.slice(0, 4) : null,    // Year only, or null
        poster: film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null, // Poster, 342 px wide
    }));
}

/**
 * Returns the full details of a film: checks the cache first, otherwise calls TMDB.
 *
 * @param {number} id - The TMDB id of the film, e.g. 438631 for Dune
 * @returns {Promise<Object|null>} The simplified film, or null if TMDB does not know it
 * @throws {Error} If TMDB answers with another error (401, 500...)
 */
export async function getFilmById(id) {
    // Cache key for this film, e.g. "film:438631"
    const key = `film:${id}`; // The key constant generates the cache key using the film's ID

    // 1. Look in the MongoDB cache first
    const cached = await getCache(key); // The cached constant waits for the film from the MongoDB cache (null if missing)
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

    // 2. Not in cache: call TMDB (details in French + cast and crew in the same request)
    console.log(`🌐 TMDB call: ${key}`);
    const url = `https://api.themoviedb.org/3/movie/${id}?language=fr-FR&append_to_response=credits`; // The url constant builds the TMDB address: film details in French + its cast
    const response = await fetch(url, { // The response constant waits for TMDB's answer
        headers: { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}` }
    });

    // Film not found: not a bug, return null (the controller sends a 404)
    if (response.status === 404) return null;
    // Other error (e.g. 401, 500): real problem, the controller sends a 500
    if (!response.ok) throw new Error(`TMDB error ${response.status}`);

    const data = await response.json(); // The data constant converts TMDB's answer into a JavaScript object

    // 3. Keep only what the front needs
    const film = { // The film constant keeps only the information the front needs
        tmdbId: data.id,
        title: data.title,                                                  // French title
        originalTitle: data.original_title,                                 // Original title
        year: data.release_date ? data.release_date.slice(0, 4) : null,     // Year only
        runtime: data.runtime,                                              // Duration in minutes
        overview: data.overview,                                            // Synopsis
        genres: data.genres.map(g => g.name),                               // Genre names only
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
        backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null, // Wide background image
        collectionId: data.belongs_to_collection ? data.belongs_to_collection.id : null,               // Saga id, or null
        // Directors: keep only the crew members whose job is "Director"
        directors: data.credits.crew
            .filter(p => p.job === 'Director')
            .map(p => ({ id: p.id, name: p.name })),
        // Main cast: the first 10 actors, with their role and photo
        cast: data.credits.cast.slice(0, 10).map(p => ({
            id: p.id,
            name: p.name,
            character: p.character,
            photo: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null
        }))
    };

    // 4. Save the simplified film in the cache, then return it
    await setCache(key, 'tmdb', film);
    return film;
}

/**
 * Returns a saga (TMDB collection) with its films, sorted by release date.
 *
 * @param {number} id - The TMDB id of the collection, e.g. 1241 for Harry Potter
 * @returns {Promise<Object|null>} The simplified collection, or null if not found
 * @throws {Error} If TMDB answers with another error
 */
export async function getCollectionById(id) {
    // Cache key for this saga, e.g. "collection:1241"
    const key = `collection:${id}`; // The key constant generates the cache key using the saga's ID

    const cached = await getCache(key); // The cached constant waits for the saga from the MongoDB cache (null if missing)
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

    console.log(`🌐 TMDB call: ${key}`);
    const url = `${TMDB_URL}/collection/${id}?language=fr-FR`; // The url constant builds the TMDB address of the saga, in French
    const response = await fetch(url, { // The response constant waits for TMDB's answer
        headers: { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}` }
    });

    if (response.status === 404) return null; // Collection not found
    if (!response.ok) throw new Error(`TMDB error ${response.status}`);

    const data = await response.json(); // The data constant converts TMDB's answer into a JavaScript object

    const collection = { // The collection constant keeps the saga's info and its films sorted by date
        id: data.id,
        name: data.name,           // e.g. "Harry Potter - Saga"
        overview: data.overview,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
        // The films of the saga ("parts" in TMDB)
        films: data.parts
            // Sort by release date, oldest first; films without a date get "9999" so they go last
            .sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'))
            .map(film => ({
                tmdbId: film.id,
                title: film.title,
                year: film.release_date ? film.release_date.slice(0, 4) : null,
                poster: film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null
            }))
    };

    await setCache(key, 'tmdb', collection);
    return collection;
}

/**
 * Gets films recommended by TMDB for a given film (cache first).
<<<<<<< HEAD
 * 
 * @param {number} id - the TMDB idof the film 
 * @returns {Promise<Array<Object>|null>} up to 10 films, or null if the film does not exist
=======
 *
 * @param {number} id - The TMDB id of the film
 * @returns {Promise<Array<Object>|null>} Up to 10 films, or null if the film does not exist
>>>>>>> docs/comments
 */
export async function getRecommendationsById(id) {
    // Cache key for this film's recommendations, e.g. "recommendations:438631"
    const key = `recommendations:${id}`; // The key constant generates the cache key using the film's ID

    const cached = await getCache(key); // The cached constant waits for the recommendations from the MongoDB cache (null if missing)
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

    console.log(`🌐 TMDB call: ${key}`);
    const url = `${TMDB_URL}/movie/${id}/recommendations?language=fr-FR`; // The url constant builds the TMDB address of the recommended films, in French
    const response = await fetch(url, { // The response constant waits for TMDB's answer
        headers: { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}` }
    });

    if (response.status === 404) return null; // Film not found
    if (!response.ok) throw new Error(`TMDB error ${response.status}`);

    const data = await response.json(); // The data constant converts TMDB's answer into a JavaScript object

    // Keep the first 10 recommended films, simplified for the front
    const fims = data.results.slice(0, 10).map(film => ({ // The fims constant keeps the first 10 recommended films, simplified for the front
        tmdbId: film.id,
        title: film.title,
        year: film.release_date ? film.release_date.slice(0, 4) : null,
        poster: film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null
    }));

    await setCache(key, 'tmdb', fims);
    return fims;
}

/**
 * Gets a person (actor or director) with their filmography (cache first).
 *
 * @param {number} id - The TMDB id of the person
 * @returns {Promise<Object|null>} The person, or null if not found
 */
export async function getPersonById(id) {
    // Cache key for this person, e.g. "person:525"
    const key = `person:${id}`; // The key constant generates the cache key using the person's ID

    const cached = await getCache(key); // The cached constant waits for the person from the MongoDB cache (null if missing)
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

    console.log(`🌐 TMDB call: ${key}`);
    // Person details in French + the films they worked on (movie_credits)
    const url = `${TMDB_URL}/person/${id}?language=fr-FR&append_to_response=movie_credits`; // The url constant builds the TMDB address: person details in French + their films
    const response = await fetch(url, { // The response constant waits for TMDB's answer
        headers: { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}` }
    });

    if (response.status === 404) return null; // Person not found
    if (!response.ok) throw new Error(`TMDB error ${response.status}`);

    const data = await response.json(); // The data constant converts TMDB's answer into a JavaScript object

    // Turns a TMDB film into a simple object for the front (used twice: DRY)
    const toFilm = (film) => ({ // The toFilm constant is a small function that turns a TMDB film into a simple object (used twice)
        tmdbId: film.id,
        title: film.title,
        year: film.release_date ? film.release_date.slice(0, 4) : null,
        poster: film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null
    });

    // Sorts films from newest to oldest; films without a date get "0000" so they go last
    const byDateDesc = (a, b) => (b.release_date || '0000').localeCompare(a.release_date || '0000'); // The byDateDesc constant sorts films from newest to oldest

    const person = { // The person constant keeps the person's info and their two film lists
        id: data.id,
        name: data.name,
        biography: data.biography,
        birthday: data.birthday,
        placeOfBirth: data.place_of_birth,
        knownFor: data.known_for_department, // "Acting" or "Directing"
        photo: data.profile_path ? `https://image.tmdb.org/t/p/w342${data.profile_path}` : null,
        // Films where the person acted
        actingFilms: data.movie_credits.cast.sort(byDateDesc).map(toFilm),
        // Films the person directed
        directedFilms: data.movie_credits.crew
            .filter(film => film.job === 'Director')
            .sort(byDateDesc)
            .map(toFilm)
    };

    await setCache(key, 'tmdb', person);
    return person;
}