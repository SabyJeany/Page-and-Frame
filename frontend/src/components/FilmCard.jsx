import { Link } from 'react-router-dom';

/**
 * Card of a film: poster, title and year. Clicking it opens the film page.
 *
 * @param {Object} props.film - { tmdbId, title, year, poster }
 */
export default function FilmCard({ film }) {
  return (
    <Link to={`/films/${film.tmdbId}`} className="block hover:opacity-80">
      {film.poster ? (
        <img
          src={film.poster}
          alt={`Poster of ${film.title}`}
          className="w-full aspect-[2/3] object-cover rounded"
          loading="lazy"
        />
      ) : (
        // No poster: grey block with the title instead
        <div className="w-full aspect-[2/3] bg-gray-200 rounded flex items-center justify-center p-2 text-center text-sm">
          {film.title}
        </div>
      )}
      <p className="mt-2 font-semibold">{film.title}</p>
      {film.year && <p className="text-sm text-gray-500">{film.year}</p>}
    </Link>
  );
}