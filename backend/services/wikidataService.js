// Import the two cache functions (read and write in MongoDB)
import { getCache, setCache } from './cacheService.js';
// Import the book search function from the Open Library service
import { searchBooks } from './openLibraryService.js';
// Import the film details function (to get the TMDB posters)
import { getFilmById } from './tmdbService.js';

const WIKIDATA_URL = 'https://query.wikidata.org/sparql'; // The WIKIDATA_URL constant stores the Wikidata address where SPARQL queries are sent

/**
 * Finds the works a film is based on (Wikidata),
 * then the matching books in Open Library. Checks the cache first.
 *
 * @param {number} tmdbId - The TMDB id of the film (positive integer)
 * @returns {Promise<Array<Object>>} The origins of the film (empty array for an original screenplay)
 * @throws {Error} If the id is invalid or if Wikidata answers with an error
 */
export async function getFilmOrigin(tmdbId) {
    // Defensive check: only a positive integer can go into the SPARQL query
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        throw new Error('Invalid TMDB id');
    }

    const key = `origin:${tmdbId}`; // The key constant generates the cache key using the film's TMDB id

    // 1. Look in the MongoDB cache first
    const cached = await getCache(key); // The cached constant waits for the origins from the MongoDB cache (null if missing)
    if (cached) {
        // Server log only (the user never sees it)
        console.log(`⚡ Cache hit: ${key}`);
        // Found: return it and stop here
        return cached;
    }

    // 2. Not in cache: ask Wikidata
    console.log(`🔎 Wikidata call: ${key}`);

    /**
     * SPARQL query sent to Wikidata:
     * - P4947 = TMDB film id → find the film
     * - P144 = based on → the works the film comes from
     * - P50 = author (OPTIONAL: kept even if unknown)
     * - French Wikipedia article (OPTIONAL: kept even if missing)
     * - Labels in French, otherwise in English
    */
   // The query constant contains the question asked to Wikidata, written in SPARQL
   const query = ` 
        SELECT ?book ?bookLabel ?authorLabel ?article WHERE {
            ?film wdt:P4947 "${tmdbId}" .
            ?film wdt:P144 ?book .
            OPTIONAL { ?book wdt:P50 ?author . }
            OPTIONAL {
                ?article schema:about ?book ;
                         schema:isPartOf <https://fr.wikipedia.org/> .
            }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en" . }
        }`;

    const url = `${WIKIDATA_URL}?format=json&query=${encodeURIComponent(query)}`; // The url constant builds the full address: JSON format + query encoded for a URL

    // Wikidata asks apps to identify themselves (User-Agent)
    const response = await fetch(url, { // The response constant waits for Wikidata's answer
        headers: { 'User-Agent': 'PageAndFrame/1.0 (student project)' }
    });

    // If the answer is not OK, stop with an error (the controller sends a 500)
    if (!response.ok) throw new Error(`Wikidata error ${response.status}`);

    const data = await response.json(); // The data constant converts Wikidata's answer into a JavaScript object

    // 3. Group the rows by book
    // SPARQL returns one row per combination (a book with 2 authors = 2 rows)
    const books = new Map(); // The books constant is a box where each book has a unique label: its Wikidata id

    for (const row of data.results.bindings) {
        const wikidataId = row.book.value.split('/').pop(); // The wikidataId constant keeps only the end of the link: ".../entity/Q190192" → "Q190192"

        // First time we see this book: create it in the box
        if (!books.has(wikidataId)) {
            books.set(wikidataId, {
                wikidataId,
                title: row.bookLabel?.value,          // Title (French or English)
                authors: [],                           // Filled just below
                wikipedia: row.article?.value || null  // French article, or null
            });
        }

        const book = books.get(wikidataId); // The book constant gets this book from the box
        const author = row.authorLabel?.value; // The author constant stores the author name in this row (undefined if none)
        // Add the author only if present and not already in the list
        if (author && !book.authors.includes(author)) {
            book.authors.push(author);
        }
    }

    // 4. Find each book in Open Library (all searches at the same time)
    // Open Library ids in Wikidata are not reliable: search by title + author instead
    const origins = await Promise.all([...books.values()].map(async (book) => { // The origins constant waits for all the books, each with its Open Library result
        // No author or no title → probably an event or a myth, not a book
        if (book.authors.length === 0 || !book.title) {
            return { ...book, openLibrary: null };
        }
        const results = await searchBooks(`${book.title} ${book.authors[0]}`.trim()); // The results constant waits for the Open Library search "title + first author"
        // Copy the book's info (...) and add the first Open Library result
        return { ...book, openLibrary: results[0] || null };
    }));

    // 5. Save in the cache for next time, then return
    await setCache(key, 'wikidata', origins);
    return origins;
}

/**
 * Finds the films adapted from the works of an author (Wikidata).
 * Checks the cache first.
 *
 * @param {string} authorId - Open Library author id, e.g. "OL79034A"
 * @returns {Promise<Array<Object>>} Films sorted by year (empty array if none)
 * @throws {Error} If the id is invalid or if Wikidata answers with an error
 */
export async function getAuthorAdaptations(authorId) {
    // Only an Open Library author id can go into the SPARQL query
    if (!/^OL\d+A$/.test(authorId)) {
        throw new Error('Invalid author id');
    }

    const key = `adaptations:${authorId}`; // The key constant generates the cache key using the author's Open Library id

    // 1. Look in the MongoDB cache first
    const cached = await getCache(key); // The cached constant waits for the adaptations from the MongoDB cache (null if missing)
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

    // 2. Not in cache: ask Wikidata
    console.log(`🔎 Wikidata call: ${key}`);

    /**
     * - P648 = Open Library id → find the author
     * - P50 = author → the works written by this author
     * - P144 = based on → the films adapted from these works
     * - P4947 = TMDB id → keep only films we can open in the app
     * - P577 = release date (OPTIONAL)
     * - English title of the work (OPTIONAL), used to match Open Library titles
     */

    // The query constant contains the question asked to Wikidata, written in SPARQL
    const query = `
        SELECT ?tmdbId ?filmLabel ?workLabel ?date ?workEn WHERE {
            ?author wdt:P648 "${authorId}" .
            ?work wdt:P50 ?author .
            ?film wdt:P144 ?work ;
                  wdt:P4947 ?tmdbId .
            OPTIONAL { ?film wdt:P577 ?date . }
            OPTIONAL { ?work rdfs:label ?workEn . FILTER(LANG(?workEn) = "en") }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en" . }
        }`;

    const url = `${WIKIDATA_URL}?format=json&query=${encodeURIComponent(query)}`; // The url constant builds the full address: JSON format + query encoded for a URL
    const response = await fetch(url, { // The response constant waits for Wikidata's answer
        headers: { 'User-Agent': 'PageAndFrame/1.0 (student project)' }
    });

    if (!response.ok) throw new Error(`Wikidata error ${response.status}`);

    const data = await response.json(); // The data constant converts Wikidata's answer into a JavaScript object

    // 3. Group the rows by film (one film can have several dates or works)
    const films = new Map(); // The films constant is a box where each film has a unique label: its TMDB id

    for (const row of data.results.bindings) {
        const tmdbId = Number(row.tmdbId.value); // The tmdbId constant converts the film's TMDB id from text to a number
        const year = row.date ? Number(row.date.value.slice(0, 4)) : null; // The year constant keeps the first 4 characters of the date (the year), or null

        if (!films.has(tmdbId)) {
            films.set(tmdbId, {
                tmdbId,
                title: row.filmLabel?.value,
                year,
                poster: null,   // Wikidata has no posters: added from TMDB below
                basedOn: [],    // Titles of the works it comes from
                basedOnEn: []   // Same titles in English
            });
        }

        const film = films.get(tmdbId); // The film constant gets this film from the box

        // Keep the earliest release date (first cinema release)
        if (year && (!film.year || year < film.year)) film.year = year;

        const work = row.workLabel?.value; // The work constant stores the title of the work in this row
        // Add the work title only once
        if (work && !film.basedOn.includes(work)) film.basedOn.push(work);

        const workEn = row.workEn?.value; // The workEn constant stores the English title of the work, if Wikidata has one
        if (workEn && !film.basedOnEn.includes(workEn)) film.basedOnEn.push(workEn);
    }

    // 4. Sort by year, oldest first (films without a year get 9999, so they go last)
    const adaptations = [...films.values()].sort( // The adaptations constant turns the box into a list sorted by year
        (a, b) => (a.year ?? 9999) - (b.year ?? 9999)
    );

    // 5. Add the TMDB poster of each film (all at the same time, TMDB answers are cached too)
    const withPosters = await Promise.all(adaptations.map(async (film) => { // The withPosters constant waits for all the films, each with its TMDB title and poster
        try {
            const details = await getFilmById(film.tmdbId); // The details constant waits for the film's TMDB details (cache first)
            // Use the TMDB title and poster when the film is found
            return details ? { ...film, title: details.title, poster: details.poster } : film;
        } catch {
            // TMDB is down for this film: keep it without a poster
            return film;
        }
    }));

    // 6. Save in the cache for next time, then return
    await setCache(key, 'wikidata', withPosters);
    return withPosters;
}