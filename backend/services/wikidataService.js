// Import the two cache functions (read and write in MongoDB)
import { getCache, setCache } from './cacheService.js';

// Import the book search function from the Open Library service
import { searchBooks } from './openLibraryService.js';

// Wikidata address where SPARQL queries are sent
const WIKIDATA_URL = 'https://query.wikidata.org/sparql';

/**
 * Finds the works a film is based on (Wikidata),
 * then the matching books in Open Library. Checks the cache first.
 *
 * @param {number} tmdbId - The TMDB id of the film (positive integer)
 * @returns {Promise<Array<Object>>} The origins of the film (empty array for an original screenplay)
 * @throws {Error} If the id is invalid or if Wikidata answers with an error
 */
export async function getFilmOrigin(tmdbId) {
    // Added: defensive check, only a positive integer can go into the SPARQL query
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        throw new Error('Invalid TMDB id');
    }

    // Cache key for this film's origin, e.g. "origin:438631"
    const key = `origin:${tmdbId}`;

    // 1. Look in the MongoDB cache first
    const cached = await getCache(key);
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

    // Full URL: JSON format + query encoded so it can travel in a URL
    const url = `${WIKIDATA_URL}?format=json&query=${encodeURIComponent(query)}`;

    // Send the request; Wikidata asks apps to identify themselves (User-Agent)
    const response = await fetch(url, {
        headers: { 'User-Agent': 'PageAndFrame/1.0 (student project)' }
    });

    // If the answer is not OK, stop with an error (the controller sends a 500)
    if (!response.ok) throw new Error(`Wikidata error ${response.status}`);

    // Convert the response body to a JavaScript object
    const data = await response.json();

    // 3. Group the rows by book
    // SPARQL returns one row per combination (a book with 2 authors = 2 rows)
    // The Map is a box where each book has a unique label: its Wikidata id
    const books = new Map();

    for (const row of data.results.bindings) {
        // Keep only the end of the link: ".../entity/Q190192" → "Q190192"
        const wikidataId = row.book.value.split('/').pop();

        // First time we see this book: create it in the box
        if (!books.has(wikidataId)) {
            books.set(wikidataId, {
                wikidataId,
                title: row.bookLabel?.value,               // Title (French or English)
                authors: [],                                // Filled just below
                wikipedia: row.article?.value || null       // French article, or null
            });
        }

        // Get the book from the box
        const book = books.get(wikidataId);
        // Author name in this row (undefined if none, thanks to ?.)
        const author = row.authorLabel?.value;
        // Add the author only if present and not already in the list
        if (author && !book.authors.includes(author)) {
            book.authors.push(author);
        }
    }

    // 4. Find each book in Open Library (all searches at the same time)
    // Open Library ids in Wikidata are not reliable: search by title + author instead
    const origins = await Promise.all([...books.values()].map(async (book) => {
        // Added: no author or no title → probably an event or a myth, not a book
        if (book.authors.length === 0 || !book.title) {
            return { ...book, openLibrary: null };
        }
        // Search "title + first author" and keep the first result
        const results = await searchBooks(`${book.title} ${book.authors[0]}`.trim());
        // Copy the book's info (...) and add the Open Library result
        return { ...book, openLibrary: results[0] || null };
    }));

    // 5. Save in the cache for next time, then return
    await setCache(key, 'wikidata', origins);
    return origins;
}