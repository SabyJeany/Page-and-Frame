import { searchBooks } from '../services/openLibraryService.js';

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