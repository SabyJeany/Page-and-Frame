import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import WorkActions from '../components/WorkActions';
import FilmOrigin from '../components/FilmOrigin';
import CastList from '../components/CastList';
import FilmList from '../components/FilmList';

// 155 -> "2h35"
function formatRuntime(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  return h > 0 ? `${h}h${m}` : `${minutes} min`;
}

/**
 * Film page, laid out like the Figma mock-up:
 * 1. poster + main info, 2. origin + cast, 3. saga + recommendations (full width).
 */
export default function FilmDetail() {
  const { id } = useParams();
  const [film, setFilm] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(null); // { moyenne, total } of all users

  useEffect(() => {
    setFilm(null);
    setError('');
    setRating(null);

    api.get(`/films/${id}`)
      .then((response) => setFilm(response.data))
      .catch((err) => {
        const status = err.response?.status;
        setError(status === 404 || status === 400 ? 'Film not found.' : 'Server error, please try again.');
      });

    // Average rating of all users (public route); no rating is not an error
    api.get(`/reviews/film/${id}`)
      .then((response) => setRating(response.data))
      .catch(() => setRating(null));
  }, [id]);

  if (error) return <p role="alert" className="p-8">{error}</p>;
  if (!film) return <p role="status" className="p-8">Loading...</p>;

  // "2021 · 2h35 · Denis Villeneuve" (missing parts are skipped)
  const infoLine = [
    film.year,
    formatRuntime(film.runtime),
    film.directors.map((director) => director.name).join(', '),
  ].filter(Boolean).join(' · ');

  return (
    <main className="max-w-5xl mx-auto p-8">
      {/* 1. Top: poster on the left, main info on the right (stacked on mobile) */}
      <div className="flex flex-col md:flex-row gap-8">
        {film.poster && (
          <img
            src={film.poster}
            alt={`Poster of ${film.title}`}
            className="w-full md:w-64 shrink-0 self-start rounded"
          />
        )}

        <section className="flex-1">
          <h1 className="text-4xl font-bold">{film.title}</h1>
          <p className="text-gray-600 mt-1">{infoLine}</p>

          {/* Average rating, only if someone rated the film */}
          {rating && rating.total > 0 && (
            <p
              className="mt-2 font-semibold"
              role="img"
              aria-label={`Average rating ${rating.moyenne} out of 5, ${rating.total} ratings`}
            >
              ★ {rating.moyenne} / 5{' '}
              <span className="font-normal text-gray-600">({rating.total} ratings)</span>
            </p>
          )}

          {/* Genres as rounded tags */}
          {film.genres.length > 0 && (
            <ul aria-label="Genres" className="flex flex-wrap gap-2 mt-3">
              {film.genres.map((genre) => (
                <li key={genre} className="border rounded-full px-3 py-1 text-sm">{genre}</li>
              ))}
            </ul>
          )}

          {/* My rating and my list */}
          <WorkActions type="film" idExterne={id} />

          <h2 className="text-lg font-bold mt-6">Overview</h2>
          <p className="mt-2">{film.overview}</p>
        </section>
      </div>

      {/* 2. Middle: origin card on the left, cast on the right (stacked on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-8 mt-10">
        <div className="bg-gray-100 rounded p-4 self-start">
          <FilmOrigin tmdbId={id} />
        </div>
        <CastList directors={film.directors} cast={film.cast} />
      </div>

      {/* 3. Bottom, full width: the saga shows the current film as "You are here" */}
      {film.collectionId && (
        <FilmList
          title="In the same saga"
          path={`/films/collection/${film.collectionId}`}
          field="films"
          currentId={id}
        />
      )}
      <FilmList title="You may also like" path={`/films/${id}/recommendations`} excludeId={id} />
    </main>
  );
}