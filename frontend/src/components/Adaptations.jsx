import { useEffect, useState } from 'react';
import api from '../services/api';
// Reusable card that shows one film (poster, title, year)
import FilmCard from './FilmCard';

/**
 * "Adapted for the screen" block, reused on the author page and the book page.
 * The parent gives the API path, so the same block works for both.
 *
 * @param {Object} props
 * @param {string} props.path - API path, e.g. "/authors/OL79034A/adaptations"
 *                              or "/books/OL893414W/adaptations"
 * @returns {JSX.Element|null} The film grid, a message, or nothing if no adaptation
 */
export default function Adaptations({ path }) {
  // null = still loading, [] = no adaptation, [...] = films found
  const [films, setFilms] = useState(null);
  // True if the request failed (Wikidata down...), different from "no adaptation"
  const [error, setError] = useState(false);

  // Load the adaptations when the block appears, and again if the path changes
  useEffect(() => {
    // Reset: avoids showing the previous films for a moment
    setFilms(null);
    setError(false);
    api.get(path)
      .then((response) => setFilms(response.data.adaptations))
      .catch(() => setError(true));
  }, [path]);

  // 1. Request failed: calm message, the rest of the page still works
  if (error) return <p role="alert" className="mt-10 text-gray-600">Adaptations unavailable for now.</p>;
  // 2. Still loading
  if (films === null) return <p role="status" className="mt-10">Looking for adaptations...</p>;
  // 3. No adaptation: null = the block does not appear at all
  if (films.length === 0) return null;

  // 4. Films found
  return (
    // <section> named by its heading, for screen readers
    <section aria-labelledby="adaptations-title" className="mt-10">
      <h2 id="adaptations-title" className="text-xl font-bold mb-4">Adapted for the screen</h2>

      {/* Film grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {films.map((film) => (
          // One <li> per film; the TMDB id is unique (grouped by the back-end)
          <li key={film.tmdbId}>
            <FilmCard film={film} />

            {/* The work(s) the film comes from, separated by commas */}
            {film.basedOn.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">Based on {film.basedOn.join(', ')}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}