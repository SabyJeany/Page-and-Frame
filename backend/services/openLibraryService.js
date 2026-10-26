import {getCache, setCache} from './cacheService.js'

const OPEN_LIBRARY_URL = 'https://openlibrary.org';

/**
 * searches books by title on open Library (cache first)
 * 
 * @param {Promise<Array<Object>>} Simplified books: id, titles, authors, year, cover
 */
export async function searchBooks(query) {
    const key = `book-search:¤{query.toLowerCase()}`;

    const cached = await getCache(key);
    if (cached) {
        console.log(`Cache hit: ${key}`)
        return cached; 
    }

    console.log(`Open Library call: ${key}`);
    //fields = only ask for what we need (lighter response)
    const url = `${OPEN_LIBRARY_URL}/search.json?q=${encodeURIComponent(query)}`
    + `&fields=key,title,author_name,first_publish_year,cover_i&limit=20`;

     const response = await fetch(url, {
        // Open Library asks apps to identify themselves
        headers: { 'User-Agent': 'PageAndFrame/1.0 (student project)' }
     });

      if (!response.ok) throw new Error(`Open Library error ${response.status}`);

    const data = await response.json();

    const books = data.docs.map(book => ({
        // "/works/OL893415W" -> "OL893415W" (the id we will store in MySQL)
        id: book.key.replace('/works/', ''),
        title: book.title,
        authors: book.author_name || [],
        year: book.first_publish_year || null,
        cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null
    }));

    await setCache(key, 'openlibrary', books);
    return books;

}

/**
 * Gets a book (Open Library "work") with its authors and editions (cache first).
 *
 * @param {string} id - The Open Library work id, e.g. "OL893414W"
 * @returns {Promise<Object|null>} The book, or null if not found
 */
export async function getBookById(id) {
    const key = `book:${id}`;

    const cached = await getCache(key);
    if (cached) {
        console.log(`⚡ Cache hit: ${key}`);
        return cached;
    }

    console.log(`📚 Open Library call: ${key}`);
    const headers = { 'User-Agent': 'PageAndFrame/1.0 (student project)' };

    // Promise.all: both requests run at the same time (faster than one after the other)
    const [workRes, editionsRes] = await Promise.all([
        fetch(`${OPEN_LIBRARY_URL}/works/${id}.json`, { headers }),
        fetch(`${OPEN_LIBRARY_URL}/works/${id}/editions.json?limit=10`, { headers })
    ]);

    if (workRes.status === 404) return null; // Book not found
    if (!workRes.ok) throw new Error(`Open Library error ${workRes.status}`);

    const work = await workRes.json();
    // If editions fail, we still show the book (with no editions)
    const editionsData = editionsRes.ok ? await editionsRes.json() : { entries: [] };

    // The description is sometimes a string, sometimes an object { value: "..." }
    const description = typeof work.description === 'string'
        ? work.description
        : work.description?.value || null;

    // The work only gives author ids: we fetch each author's name (in parallel)
    const authorKeys = (work.authors || []).map(a => a.author.key); // e.g. "/authors/OL79034A"
    const authors = await Promise.all(authorKeys.map(async (authorKey) => {
        const res = await fetch(`${OPEN_LIBRARY_URL}${authorKey}.json`, { headers });
        const author = res.ok ? await res.json() : {};
        return {
            id: authorKey.replace('/authors/', ''),
            name: author.name || 'Auteur inconnu'
        };
    }));

    const editions = editionsData.entries.map(edition => ({
        id: edition.key.replace('/books/', ''),
        title: edition.title,
        publishers: edition.publishers || [],
        publishDate: edition.publish_date || null,
        pages: edition.number_of_pages || null
    }));

    const book = {
        id,
        title: work.title,
        description,
        authors,
        firstPublishDate: work.first_publish_date || null,
        subjects: (work.subjects || []).slice(0, 10),
        cover: work.covers?.[0] ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : null,
        editions
    };

    await setCache(key, 'openlibrary', book);
    return book;
}