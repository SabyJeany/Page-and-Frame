import {getAuthorById } from '../services/openLibraryService.js';
import { getAuthorAdaptations } from '../services/wikidataService.js';

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
/**
 * controller for GET /api/authors/:id/adaptations
 */
export async function getAdaptations(req, res) {
  const { id } = req.params;

  // Same check as getAuthor: "OL" + digits + "A"
  if (!/^OL\d+A$/.test(id)) {
    return res.status(400).json({ message: 'Invalid identifier' });
  }

  try {
    const adaptations = await getAuthorAdaptations(id);
    // No adaptation is not an error: 200 with an empty list
    res.json({ authorId: id, adaptations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}