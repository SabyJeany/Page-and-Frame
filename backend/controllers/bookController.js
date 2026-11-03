import { searchBooks, getBookById } from '../services/openLibraryService.js';
import { getAuthorAdaptations } from '../services/wikidataService.js';

/**
 * Controller for GET /api/books/search?q=...
 * Checks the search text, then returns the matching books.
 */
export async function search(req, res) {
    const q = req.query.q?.trim();

    if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        const books = await searchBooks(q);
        res.json(books);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

/**
 * Controller for GET /api/books/:id
 * Checks the id format, then returns the book details.
 */
export async function getById(req, res) {
    const { id } = req.params;

    // An Open Library work id looks like "OL" + digits + "W", e.g. "OL893414W"
    if (!/^OL\d+W$/.test(id)) {
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        const book = await getBookById(id);
        if (!book) {
            return res.status(404).json({ message: 'Livre introuvable' });
        }
        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

/**
 * Controller for GET /api/books/:id/adaptations (public)
 * Films adapted from this book: takes all the author's adaptations,
 * then keeps only those based on a work with the same title.
 *
 * @param {Object} req - The request (the Open Library id is in req.params.id)
 * @param {Object} res - The response sent back to the front
 * @returns {Promise<Object>} JSON with the book id and its adaptations
 */
export async function getAdaptations(req, res) {
    // Read the book id from the URL, e.g. /api/books/OL893414W/adaptations
    const { id } = req.params;

    // The id must look like an Open Library work id ("OL" + digits + "W"), otherwise 400
    if (!/^OL\d+W$/.test(id)) {
        return res.status(400).json({ message: 'Invalid identifier' });
    }

    try {
        // Check that the book exists and get its title and authors (cache first)
        const book = await getBookById(id);
        // Unknown book: 404
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Take the first author of the book
        const author = book.authors[0];
        // No known author: we cannot look for adaptations, send an empty list
        if (!author) {
            return res.json({ bookId: id, adaptations: [] });
        }

        // 1. Get ALL the films adapted from this author's works (cached)
        const all = await getAuthorAdaptations(author.id);

        // 2. Book title in lowercase without extra spaces, to compare fairly
        const title = book.title.trim().toLowerCase();

        // 3. Keep only the films based on a work with the same title
        const adaptations = all.filter((film) =>
            // Put the French and English titles in one list
            // (|| [] in case basedOnEn is missing in old cached data)
            [...film.basedOn, ...(film.basedOnEn || [])]
                // some = "is there at least one title that matches?"
                .some((work) => work.trim().toLowerCase() === title)
        );

        // Send the book id and its adaptations (empty list if none)
        res.json({ bookId: id, adaptations });
    } catch (error) {
        // Unexpected error (Wikidata down...): log it, send a generic message
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}