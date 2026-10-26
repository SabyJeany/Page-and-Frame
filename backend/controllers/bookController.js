import { searchBooks, getBookById } from '../services/openLibraryService.js';

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