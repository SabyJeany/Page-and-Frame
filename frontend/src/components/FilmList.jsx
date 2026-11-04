import { useEffect, useState } from 'react';
import api from '../services/api';
// Reusable card that shows one film (poster, title, year)
import FilmCard from './FilmCard';

/**
 * A titled block of film cards loaded from the API (saga, recommendations...).
 * The parent gives the title and the API path, so the same block is reused everywhere.
 *
 * @param {Object} props
 * @param {string} props.title - Title of the block, e.g. "In the same saga"
 * @param {string} props.path - API path, e.g. "/films/438631/recommendations"
 * @param {string} [props.field] - Where the list is in the response (e.g. "films"); none = the response is the list
 * @param {string|number} [props.excludeId] - A film to hide (the film of the current page)
 * @returns {JSX.Element|null} The film grid, a message, or nothing if the list is empty
 */
export default function FilmList({ title, path, field, excludeId }) {
  // null = still loading, [] = nothing, [...] = films found
  const [films, setFilms] = useState(null);
  // True if the request failed
  const [error, setError] = useState(false);

  // Load the films when the block appears, and again if the path or the field changes
  useEffect(() => {
    // Reset: avoids showing the previous films for a moment
    setFilms(null);
    setError(false);
    api.get(path)
      // field given: the list is inside the response (e.g. response.data.films)
      // no field: the response itself is the list
      .then((response) => setFilms(field ? response.data[field] : response.data))
      .catch(() => setError(true));
  }, [path, field]);

  // 1. Request failed: calm message with the block title, the rest of the page still works
  if (error) return <p className="mt-8 text-gray-600">{title}: unavailable for now.</p>;
  // 2. Still loading
  if (films === null) return <p role="status" className="mt-8">Loading...</p>;

  // 3. Hide the film of the current page (a saga contains it)
  // String(...) on both sides: the id can be a number (438631) or text ("438631")
  const shown = films.filter((film) => String(film.tmdbId) !== String(excludeId));
  // Nothing left to show: the block does not appear at all
  if (shown.length === 0) return null;

  // 4. Films to show
  return (
    // <section> named with aria-label, for screen readers
    <section aria-label={title} className="mt-10">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      {/* Film grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {shown.map((film) => (
          // One <li> per film; the TMDB id is unique
          <li key={film.tmdbId}>
            <FilmCard film={film} />
          </li>
        ))}
      </ul>
    </section>
  );
}