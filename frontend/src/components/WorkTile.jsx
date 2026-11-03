import { useEffect, useState } from 'react';
import api from '../services/api';
// The two reusable cards: one for films, one for books
import FilmCard from './FilmCard';
import BookCard from './BookCard';

/**
 * Shows a film or a book from its id only (used on the profile page).
 * MySQL only stores the external id, so this tile asks the back-end
 * for the details (title, poster...) before showing the right card.
 *
 * @param {Object} props
 * @param {string} props.type - 'film' or 'livre'
 * @param {string} props.idExterne - TMDB id or Open Library id
 * @returns {JSX.Element} A film card, a book card, a loading block or an error
 */
export default function WorkTile({ type, idExterne }) {
  // The work data (null until the response arrives)
  const [work, setWork] = useState(null);
  // True if the request failed
  const [error, setError] = useState(false);

  // Load the work when the tile appears, and again if the type or the id changes
  useEffect(() => {
    // Added: reset, so the previous work is not shown for a moment
    setWork(null);
    setError(false);

    // Choose the right route: /films/438631 or /books/OL893414W
    const path = type === 'film' ? `/films/${idExterne}` : `/books/${idExterne}`;
    api.get(path)
      .then((response) => setWork(response.data))
      .catch(() => setError(true));
  }, [type, idExterne]);

  // 1. Request failed: small message, the rest of the profile still works
  if (error) return Unavailable;

  // 2. While loading: a grey block the size of a poster, gently blinking
  // aria-hidden: ignored by screen readers (decoration only)
  if (!work) return ;

  // 3. Loaded: show a film card or a book card, depending on the type
  return type === 'film' ? <FilmCard film={work} /> : <BookCard book={work} />;
}