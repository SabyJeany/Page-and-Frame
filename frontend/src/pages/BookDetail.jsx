import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
// Buttons to rate the work and add it to a list (reused on film and book pages)
import WorkActions from '../components/WorkActions';
import Adaptations from '../components/Adaptations';

/**
 * Book page: shows the details of an Open Library work from GET /api/books/:id.
 *
 * @returns {JSX.Element} The book page, a loading message or an error
 */
export default function BookDetail() {
  // The id in the URL, e.g. /books/OL893414W → "OL893414W"
  const { id } = useParams();
  // The book data (null until the response arrives)
  const [book, setBook] = useState(null);
  // Error message, if the request fails
  const [error, setError] = useState('');

  // Load the book when the page opens, and again each time the id changes
  useEffect(() => {
    // Reset: avoids showing the previous book for a moment
    setBook(null);
    setError('');
    api.get(`/books/${id}`)
      .then((response) => setBook(response.data))
      .catch((err) => {
        // 404 (unknown) or 400 (invalid id) → "not found"; anything else → server problem
        const status = err.response?.status;
        setError(status === 404 || status === 400 ? 'Book not found.' : 'Server error, please try again.');
      });
  }, [id]);

  // 1. Error: role="alert" is announced right away by screen readers
  if (error) return <p role="alert" className="p-8">{error}</p>;
  // 2. Still loading
  if (!book) return <p role="status" className="p-8">Loading...</p>;

  // 3. Book loaded
  return (
    // <main>: the main content of the page
    <main className="max-w-5xl mx-auto p-8">

      {/* Top of the page: cover + info, stacked on mobile, side by side on larger screens */}
      <div className="flex flex-col md:flex-row gap-8">

        {/* Cover only if Open Library has one; alt describes the image */}
        {book.cover && (
          <img
            src={book.cover}
            alt={`Cover of ${book.title}`}
            className="w-full md:w-64 rounded self-start" // Full width on mobile, 256 px on larger screens
          />
        )}

        <section>
          {/* <h1>: the main title of the page = the book title */}
          <h1 className="text-3xl font-bold">{book.title}</h1>

          {/* Authors only if known; each author links to their page */}
          {book.authors.length > 0 && (
            <p className="text-gray-600">
              {/* {' '}: keeps the space after "by" (JSX removes it at the end of a line) */}
              by{' '}
              {book.authors.map((author, index) => (
                <span key={author.id}>
                  {/* Comma before each name except the first one */}
                  {index > 0 && ', '}
                  <Link to={`/authors/${author.id}`} className="underline">{author.name}</Link>
                </span>
              ))}
            </p>
          )}

          {/* First publication date, only if known */}
          {book.firstPublishDate && <p className="text-gray-600">First published: {book.firstPublishDate}</p>}

          {/* Summary; whitespace-pre-line keeps the line breaks */}
          {book.description && <p className="mt-4 whitespace-pre-line">{book.description}</p>}

          {/* Rating and list buttons for this book */}
          <WorkActions type="livre" idExterne={id} />

          {/* Subjects as small tags; aria-label gives the list a name for screen readers */}
          {book.subjects.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-6" aria-label="Subjects">
              {book.subjects.map((subject) => (
                // The subject text is unique, so it can be used as the key
                <li key={subject} className="bg-gray-100 px-2 py-1 rounded text-sm">{subject}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Editions: a real table, so screen readers can read it cell by cell */}
      {book.editions.length > 0 && (
        // overflow-x-auto: the table scrolls sideways on small screens instead of breaking the page
        <section className="mt-10 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Editions</h2>

          {/* <table>: the whole table */}
          <table className="w-full text-left text-sm">
            {/* <thead>: the header, with the column titles */}
            <thead>
              {/* <tr>: one row */}
              <tr className="border-b">
                {/* <th scope="col">: title of a column, read before each cell */}
                <th scope="col" className="py-2">Title</th>
                <th scope="col">Publisher</th>
                <th scope="col">Date</th>
                <th scope="col">Pages</th>
              </tr>
            </thead>

            {/* <tbody>: the body, one row per edition */}
            <tbody>
              {book.editions.map((edition) => (
                <tr key={edition.id} className="border-b">
                  {/* <td>: one data cell; "—" if the info is missing */}
                  <td className="py-2">{edition.title}</td>
                  <td>{edition.publishers.join(', ') || '—'}</td>
                  <td>{edition.publishDate || '—'}</td>
                  <td>{edition.pages || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {/* Films adapted from this book (shown only if there are some) */}
      <Adaptations path={`/books/${id}/adaptations`} />
    </main>
  );
}