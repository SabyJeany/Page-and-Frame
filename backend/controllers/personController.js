import { getPersonById } from '../services/tmdbService.js';

/**
 * Controller for GET /api/persons/:id
 * Returns an actor or director with their filmography.
 */
export async function getPerson(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        const person = await getPersonById(id);
        if (!person) {
            return res.status(404).json({ message: 'Personne introuvable' });
        }
        res.json(person);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}