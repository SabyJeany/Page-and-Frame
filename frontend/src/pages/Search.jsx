import { useEffect, useState } from 'react';
// useSearchParams: reads and writes the parameters after the ? in the URL
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
// The two reusable cards: one for films, one for books
import FilmCard from '../components/FilmCard';
import BookCard from '../components/BookCard';

// The two kinds of search: button label, API path, and the field used as React key
// Written outside the component: it never changes
const TYPES = {
  films: { label: 'Films', path: '/films/search', key: 'tmdbId' },
  books: { label: 'Books', path: '/books/search', key: 'id' },
};

/**
 * Home page: search films or books.
 * The text and the type are kept in the URL (?q=dune&type=books),
 * so a search can be shared, bookmarked, and the Back button works.
 *
 * @returns {JSX.Element} The search page with its results
 */
export default function Search() {
  // searchParams: the URL parameters; setSearchParams: changes them
  const [searchParams, setSearchParams] = useSearchParams();

  // Search text from the URL ('' if there is none)
  const q = searchParams.get('q') || '';
  // Type from the URL; unknown or missing type: films by default
  const type = searchParams.get('type') === 'books' ? 'books' : 'films';

  // What is typed in the input (not searched yet)
  const [text, setText] = useState(q);
  // The results returned by the back-end
  const [results, setResults] = useState([]);
  // True while the request is running
  const [loading, setLoading] = useState(false);
  // Error message, if the request fails
  const [error, setError] = useState('');

  // Added: keep the input in sync with the URL (e.g. when using the Back button)
  useEffect(() => {
    setText(q);
  }, [q]);

  // Runs each time the text OR the type changes in the URL
  useEffect(() => {
    // Nothing to search: empty the results and stop here
    if (!q) {
      setResults([]);
      return;
    }

    // Reset before the new search
    setLoading(true);
    setError('');
    setResults([]);

    // Call the right route; params adds ?q=... to the URL (encoded automatically)
    api.get(TYPES[type].path, { params: { q } })
      .then((response) => setResults(response.data))
      .catch(() => setError('Search failed, please try again.'))
      // finally: runs in every case, success or error
      .finally(() => setLoading(false));
  }, [q, type]);

  /**
   * Starts the search: writes the text and the type into the URL.
   * The useEffect above then sees the change and calls the API.
   * @param {Event} e - The submit event
   */
  function handleSubmit(e) {
    // Stop the browser from reloading the page
    e.preventDefault();
    // Remove spaces at the start and end
    const value = text.trim();
    // Only search if something was typed
    if (value) setSearchParams({ q: value, type });
  }

  /**
   * Switches between films and books: keeps the current text, changes only the type.
   * @param {'films'|'books'} newType - The type chosen by the user
   */
  function changeType(newType) {
    const value = text.trim();
    // With text: search it again in the new type; without text: change the type only
    setSearchParams(value ? { q: value, type: newType } : { type: newType });
  }

  return (
    // <main>: the main content of the page
    <main className="max-w-5xl mx-auto p-8">
      {/* <h1>: the main title of the page */}
      <h1 className="text-3xl font-bold mb-2">Page & Frame</h1>
      {/* Slogan */}
      <p className="mb-6 text-gray-600">Every film has a story before the story.</p>

      {/* Films / Books switch */}
      {/* role="group" + aria-label: screen readers know these buttons go together */}
      <div className="flex gap-2 mb-3" role="group" aria-label="Search type">
        {/* Object.entries turns TYPES into a list: [['films', {...}], ['books', {...}]] */}
        {Object.entries(TYPES).map(([value, { label }]) => (
          <button
            key={value}
            type="button"                      // Not a submit button: it does not send the form
            onClick={() => changeType(value)}
            aria-pressed={type === value}      // Tells screen readers which button is active
            // Active button: black background; template string adds the class only when active
            className={`border px-3 py-1 ${type === value ? 'bg-black text-white' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search form; role="search" marks it as the search area of the page */}
      <form onSubmit={handleSubmit} role="search" className="flex gap-2 mb-8">
        {/* sr-only: label hidden on screen but read by screen readers */}
        <label htmlFor="search" className="sr-only">
          {type === 'films' ? 'Search a film' : 'Search a book'}
        </label>
        <input
          id="search"
          type="search"                         // Search input: adds a clear button on some browsers
          className="border p-2 flex-1"         // flex-1: takes all the remaining width
          placeholder={type === 'films' ? 'Search a film, e.g. Dune' : 'Search a book, e.g. Dune Messiah'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="bg-black text-white px-4">Search</button>
      </form>

      {/* aria-live: screen readers announce these messages when they change */}
      <div aria-live="polite">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {/* Search done, no error, but no result */}
        {!loading && q && results.length === 0 && !error && <p>Nothing found for "{q}".</p>}
      </div>

      {/* Results grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {results.map((item) => (
          // Key: tmdbId for films, id for books (taken from TYPES)
          <li key={item[TYPES[type].key]}>
            {/* Ternary: film card or book card, depending on the type */}
            {type === 'films' ? <FilmCard film={item} /> : <BookCard book={item} />}
          </li>
        ))}
      </ul>
    </main>
  );
}