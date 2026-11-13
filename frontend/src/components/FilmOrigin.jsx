import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

/**
 * "Based on" block: shows where the film comes from (GET /api/films/:id/origin).
 *
 * @param {Object} props
 * @param {string} props.tmdbId - TMDB id of the film
 * @returns {JSX.Element} The list of origins, a loading message or a fallback text
 */
export default function FilmOrigin({ tmdbId }) {
  // null = still loading, [] = no known source, [...] = origins found
  const [origins, setOrigins] = useState(null);
  // True if the request failed (Wikidata down...), different from "no source"
  const [error, setError] = useState(false);

  // Load the origins when the block appears, and again if the film changes
  useEffect(() => {
    setOrigins(null);
    setError(false);
    api.get(`/films/${tmdbId}/origin`)
      .then((response) => setOrigins(response.data.origins))
      .catch(() => setError(true));
  }, [tmdbId]);

  // 1. Request failed: don't pretend it is an original screenplay
  if (error) return <p className="text-gray-600">Origin unavailable for now.</p>;
  // 2. Still loading
  if (origins === null) return <p role="status">Looking for the origin...</p>;
  // 3. Nothing found
  if (origins.length === 0) return <p>Original screenplay: no known source.</p>;

  // 4. Origins found: one item per work
  return (
    <section aria-labelledby="origin-title" className="mt-8">
      <h2 id="origin-title" className="text-xl font-bold mb-2">Based on</h2>
      <ul className="flex flex-col gap-3">
        {origins.map((origin) => (
          // key: unique id so React can track each item
          <li key={origin.wikidataId} className="flex gap-4">
  {/* Book cover, only if found in Open Library */}
  {origin.openLibrary?.cover && (
    <img
      src={origin.openLibrary.cover}
      alt={`Cover of ${origin.title}`}
      className="w-20 shrink-0 self-start rounded"
    />
  )}
  <div>
    <p className="text-xs font-semibold uppercase text-gray-500">Adapted from the book</p>
    <p className="font-semibold">
      {origin.title}
      {origin.authors.length > 0 && ` — ${origin.authors.join(', ')}`}
      {origin.openLibrary?.year && ` (${origin.openLibrary.year})`}
    </p>
    {origin.openLibrary && (
      <Link to={`/books/${origin.openLibrary.id}`} className="underline text-sm">
        See the book →
      </Link>
    )}
    {origin.wikipedia && (
      <a href={origin.wikipedia} target="_blank" rel="noopener noreferrer" className="underline text-sm ml-4">
        Wikipedia
      </a>
    )}
  </div>
</li>
        ))}
      </ul>
    </section>
  );
}