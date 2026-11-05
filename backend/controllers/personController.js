import { getPersonById } from '../services/tmdbService.js';

/**
 * Controller for GET /api/persons/:id
 * Returns an actor or director with their filmography.
 */
export async function getPerson(req, res) {
    const id = Number(req.params.id); // Reads the person’s ID from the URL and converts it into a number.

    if (!Number.isInteger(id) || id <= 0) { // Check if the integer is positive. Otherwise 400
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        const person = await getPersonById(id);
        if (!person) {
            // getPerson calls `getPersonById`, which first searches the MongoDB cache, then the TMDB. If the person does not exist, it returns a 404.
            return res.status(404).json({ message: 'Personne introuvable' });
        }
        res.json(person);  // Otherwise, she puts the person in the spotlight, along with their photo, biography and films.
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}