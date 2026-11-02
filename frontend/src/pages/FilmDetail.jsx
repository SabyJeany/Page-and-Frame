import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import FilmOrigin from '../components/FilmOrigin';

/**
 * Film page: shows the details of a film from GET /api/films/:id.
 * 
 * @returns {JSX.Element} The film page, a loading message or an error
 */

export default function FilmDetail() {
  // The id in the URL, e.g. /films/438631 → "438631"
  const { id } = useParams();
  // The film data (null until the response arrives)
  const [film, setFilm] = useState(null);
  // Error message, if the request fails
  const [error, setError] = useState('');

 // Load the film when the page opens, and again each time the id changes
useEffect(() => {
  api.get(`/films/${id}`)
    .then((response) => setFilm(response.data))
    // 400 = invalid id, 404 = unknown film; anything else = server problem
    .catch((err) => {
      const status = err.response?.status;
      setError(
        status === 404 || status === 400
          ? 'Film not found.'
          : 'Server error, please try again.'
      );
    });
}, [id]);

  // 1. Error: show the message (role="alert" is announced by screen readers)
  if (error) return <p role="alert" className="p-8">{error}</p>;
  // 2. Still loading
  if (!film) return <p role="status" className="p-8">Loading...</p>;

  // 3. Film loaded: poster on the left, text on the right (stacked on mobile)
  return (
    <main className="max-w-4xl mx-auto p-8 flex flex-col md:flex-row gap-8">
      {/* Poster only if TMDB has one; alt describes the image */}
      {film.poster && (
        <img
          src={film.poster}
          alt={`Poster of ${film.title}`}
          className="w-64 rounded"
        />
      )}

      <section>
        <h1 className="text-3xl font-bold">{film.title}</h1>
        {/* Year only if known */}
        {film.year && <p className="text-gray-600">{film.year}</p>}
        <p className="mt-4">{film.overview}</p>
        {/* "Based on" block: shows the source of the film, if any */}
        <FilmOrigin tmdbId={id} />
      </section>
    </main>
  );
}