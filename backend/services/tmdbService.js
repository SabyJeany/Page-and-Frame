import { getCache, setCache } from './cacheService.js'; // Import the two cache functions (read and write in MongoDB)


const TMDB_URL = 'https://api.themoviedb.org/3'; // Base URL of the TMDB API (version 3)

/**
 * Calls the TMDB API with the read token stored in .env.
 *
 * @param {string} path - The endpoint to call, e.g. "/search/movie?query=dune"
 * @returns {Promise<Object>} The JSON response from TMDB
 * @throws {Error} If TMDB answers with an error status
 */
async function tmdbFetch(path) { // Send the HTTP request to TMDB (base URL + path)

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

export async function getFilmById(id) {
    const key = `film:${id}`;

    const cached = await getCache(key);
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

console.log(`🌐 TMDB call: ${key}`);
    const url = `https://api.themoviedb.org/3/movie/${id}?language=fr-FR&append_to_response=credits`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}` }
    });

    if (response.status === 404) return null; // Film not found
    if (!response.ok) throw new Error(`TMDB error ${response.status}`); // Other error (e.g. 401, 500)

    const data = await response.json();

    const film = {
        tmdbId: data.id,
        title: data.title,
        originalTitle: data.original_title,
        year: data.release_date ? data.release_date.slice(0, 4) : null,
        runtime: data.runtime,
        overview: data.overview,
        genres: data.genres.map(g => g.name),
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
        backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
        collectionId: data.belongs_to_collection ? data.belongs_to_collection.id : null,
        directors: data.credits.crew
            .filter(p => p.job === 'Director')
            .map(p => ({id: p.id, name: p.name})),
        cast: data.credits.cast.slice(0, 10).map(p=> ({
            id: p.id,
            name: p.name,
            character: p.character,
            photo: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null
        }))
    };
    await setCache(key, 'tmdb', film);
    return film;
}

export async function getCollectionById(id) {
    const key = `collection:${id}`;

    const cached = await getCache(key);
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

    console.log(`🌐 TMDB call: ${key}`);
    const url = `${TMDB_URL}/collection/${id}?language=fr-FR`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}` }
    });

    if (response.status === 404) return null; // Collection not found
    if (!response.ok) throw new Error (`TMDB error ${response.status}`);
    
    const data = await response.json();

    const collection = {
        id: data.id,
        name: data.name,
        overview: data.overview,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
        films: data.parts
            //.sort by release date (films without a date go last)
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
            
