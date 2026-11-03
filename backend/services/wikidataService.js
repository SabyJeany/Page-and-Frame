// Import the two cache functions (read and write in MongoDB)
import { getCache, setCache } from './cacheService.js';

// Import the book search function from the Open Library service
import { searchBooks } from './openLibraryService.js';

// Import the film details function (to get the TMDB posters)
import { getFilmById } from './tmdbService.js';

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

  const key = `adaptations:${authorId}`;

  // 1. Look in the MongoDB cache first
  const cached = await getCache(key);
  if (cached) {
    console.log(`⚡ Cache hit: ${key}`);
    return cached;
  }

  // 2. Not in cache: ask Wikidata
  console.log(`🔎 Wikidata call: ${key}`);

  /**
   * - P648  = Open Library id → find the author
   * - P50   = author → the works written by this author
   * - P144  = based on → the films adapted from these works
   * - P4947 = TMDB id → keep only films we can open in the app
   * - P577  = release date (OPTIONAL)
   */
  const query = `
    SELECT ?tmdbId ?filmLabel ?workLabel ?date WHERE {
      ?author wdt:P648 "${authorId}" .
      ?work wdt:P50 ?author .
      ?film wdt:P144 ?work ;
            wdt:P4947 ?tmdbId .
      OPTIONAL { ?film wdt:P577 ?date . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en" . }
    }`;

  const url = `${WIKIDATA_URL}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PageAndFrame/1.0 (student project)' }
  });
  if (!response.ok) throw new Error(`Wikidata error ${response.status}`);
  const data = await response.json();

  // 3. Group the rows by film (one film can have several dates or works)
  const films = new Map();
  for (const row of data.results.bindings) {
    const tmdbId = Number(row.tmdbId.value);
    const year = row.date ? Number(row.date.value.slice(0, 4)) : null;

    if (!films.has(tmdbId)) {
      films.set(tmdbId, {
        tmdbId,
        title: row.filmLabel?.value,
        year,
        poster: null,        // Wikidata has no posters: FilmCard shows a grey block
        basedOn: []          // Titles of the works it comes from
      });
    }

    const film = films.get(tmdbId);
    // Keep the earliest release date (first cinema release)
    if (year && (!film.year || year < film.year)) film.year = year;
    // Add the work title only once
    const work = row.workLabel?.value;
    if (work && !film.basedOn.includes(work)) film.basedOn.push(work);
  }

  // 4. Sort by year, oldest first (films without a year at the end)
  const adaptations = [...films.values()].sort(
    (a, b) => (a.year ?? 9999) - (b.year ?? 9999)
  );

   // 5. Add the TMDB poster of each film (all at the same time, TMDB answers are cached too)
  const withPosters = await Promise.all(adaptations.map(async (film) => {
    try {
      const details = await getFilmById(film.tmdbId);
      // Use the TMDB title and poster when the film is found
      return details ? { ...film, title: details.title, poster: details.poster } : film;
    } catch {
      //  TMDB is down for this film: keep it without a poster
      return film;
    }
  }));

  // 6. Save in the cache for next time, then return
  await setCache(key, 'wikidata', withPosters);
  return withPosters;
}