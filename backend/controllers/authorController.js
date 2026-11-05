import {getAuthorById } from '../services/openLibraryService.js';
import { getAuthorAdaptations } from '../services/wikidataService.js';

/**
 * controller for GET /api/authors/:id
 * 
 */

export async function getAuthor(req, res) {
    const {id} = req.params;

    /** 
     * An Open Library author id looks "OL" + digits +"A"
     * The circumflex at the start means ‘start of text’
     * ‘OL’, the exact two letters, stands for Open Library.
     * \d means ‘a digit’
     * and the + immediately after it means ‘one or more’;
     * A’, the exact letter, stands for ‘author’;
     */

    if (!/^OL\d+A$/.test(id)) {
        return res.status(400).json({message: 'invalid identifier'});
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
export async function getAdaptations(req, res) { // Reads the ID, checks it against the regex, calls getAuthorAdaptations, and returns the films
  const { id } = req.params; // r=Retrieves the ID contained in the request URL.

  // Same check as getAuthor: "OL" + digits + "A"
  if (!/^OL\d+A$/.test(id)) {
    return res.status(400).json({ message: 'Invalid identifier' });
  }

  try {
    const adaptations = await getAuthorAdaptations(id); // If the answer isn’t there, it queries Wikidata to find the author, their books, and then the films based on those books
    // No adaptation is not an error: 200 with an empty list
    res.json({ authorId: id, adaptations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}