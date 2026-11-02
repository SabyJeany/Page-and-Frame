import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import FilmCard from '../components/FilmCard';

/**
 * Home page: search a film, results come from GET /api/films/search?q=...
 */
export default function Search() {
  // The search text is kept in the URL (?q=dune): the back button and links keep it
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [text, setText] = useState(q);        // What the user is typing
  const [films, setFilms] = useState([]);     // Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Runs each time "q" changes in the URL
  useEffect(() => {
    if (!q) return;

    setLoading(true);
    setError('');
    api.get('/films/search', { params: { q } })
      .then((response) => setFilms(response.data))
      .catch(() => setError('Search failed, please try again.'))
      .finally(() => setLoading(false));
  }, [q]);

  function handleSubmit(e) {
    e.preventDefault();
    const value = text.trim();
    if (value) setSearchParams({ q: value }); // Changes the URL, which starts the search
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Page & Frame</h1>
      <p className="mb-6 text-gray-600">Every film has a story before the story.</p>

      <form onSubmit={handleSubmit} role="search" className="flex gap-2 mb-8">
        <label htmlFor="search" className="sr-only">Search a film</label>
        <input
          id="search"
          type="search"
          className="border p-2 flex-1"
          placeholder="Search a film, e.g. Dune"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="bg-black text-white px-4">Search</button>
      </form>

      {/* aria-live: screen readers announce the changes */}
      <div aria-live="polite">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && q && films.length === 0 && !error && <p>No film found for "{q}".</p>}
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {films.map((film) => (
          <li key={film.tmdbId}>
            <FilmCard film={film} />
          </li>
        ))}
      </ul>
    </main>
  );
}