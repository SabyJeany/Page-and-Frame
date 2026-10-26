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