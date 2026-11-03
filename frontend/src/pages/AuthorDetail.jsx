import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
// Reusable card that shows one book (cover, title, year)
import BookCard from '../components/BookCard';

/**
 * Author page: shows an Open Library author from GET /api/authors/:id.
 *
 * @returns {JSX.Element} The author page, a loading message or an error
 */
export default function AuthorDetail() {
  // The id in the URL, e.g. /authors/OL79034A → "OL79034A"
  const { id } = useParams();
  // The author's data (null until the response arrives)
  const [author, setAuthor] = useState(null);
  // Error message, if the request fails
  const [error, setError] = useState('');

  // Load the author when the page opens, and again each time the id changes
  useEffect(() => {
    // Reset: avoids showing the previous author for a moment
    setAuthor(null);
    setError('');
    api.get(`/authors/${id}`)
      .then((response) => setAuthor(response.data))
      .catch((err) => {
        // 404 (unknown) or 400 (invalid id) → "not found"; anything else → server problem
        const status = err.response?.status;
        setError(status === 404 || status === 400 ? 'Author not found.' : 'Server error, please try again.');
      });
  }, [id]);

  // 1. Error: role="alert" is announced right away by screen readers
  if (error) return <p role="alert" className="p-8">{error}</p>;
  // 2. Still loading
  if (!author) return <p role="status" className="p-8">Loading...</p>;

  // 3. Author loaded
  return (
    // <main>: the main content of the page
    <main className="max-w-5xl mx-auto p-8">

      {/* Top of the page: photo + info, stacked on mobile, side by side on larger screens */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">

        {/* Photo only if Open Library has one; alt describes the image */}
        {author.photo && (
          <img
            src={author.photo}
            alt={`Photo of ${author.name}`}
            className="w-48 rounded self-start" // self-start: the photo is not stretched
          />
        )}

        <section>
          {/* <h1>: the main title of the page = the author's name */}
          <h1 className="text-3xl font-bold">{author.name}</h1>

          {/* Birth date, and death date if there is one, e.g. "1920 – 1986" */}
          {author.birthDate && (
            <p className="text-gray-600">
              {author.birthDate}
              {author.deathDate && ` – ${author.deathDate}`}
            </p>
          )}

          {/* Biography; whitespace-pre-line keeps the line breaks */}
          {author.bio && <p className="mt-4 whitespace-pre-line">{author.bio}</p>}
        </section>
      </div>

      {/* The author's books, only if there is at least one */}
      {author.works.length > 0 && (
        <section>
          {/* <h2>: sub-title of the section */}
          <h2 className="text-xl font-bold mb-4">Books</h2>

          {/* Book grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {author.works.map((book) => (
              // One <li> per book; the Open Library id is unique
              <li key={book.id}>
                <BookCard book={book} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}