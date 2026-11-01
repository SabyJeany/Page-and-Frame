import {getAuthorById } from '../services/openLibraryService.js';

/**
 * controller for GET /api/authors/:id
 */

export async function getAuthor(req, res) {
    const {id} = req.params;

    // An Open Library author id looks "OL" + digits +"A"
    if (!/^OL\d+A$/.test(id)) {
        return res.status(400).json({message: ' invalid identifier'});
    }
    
    try {
        const author = await getAuthorById(id);
        if (!author) {
            return res.status(404).json({message: 'Author not found'});
        }
        res.json(author);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'server error'});
    }
}