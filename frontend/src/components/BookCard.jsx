// Import Link: React's version of the <a> tag (changes page without reloading)
import { Link } from 'react-router-dom';

/**
 * Card of a book: cover, title and year. Clicking it opens the book page.
 *
 * @param {Object} props
 * @param {Object} props.book - { id, title, year, cover }
 * @returns {JSX.Element} A clickable book card
 */
export default function BookCard({ book }) {
  return (
    // The whole card is a link to the book page, e.g. /books/OL893414W
    // block: the link takes the full width; hover:opacity-80: slightly faded on hover
    <Link to={`/books/${book.id}`} className="block hover:opacity-80">

      {/* Cover if Open Library has one, otherwise a grey block */}
      {book.cover ? (
        <img
          src={book.cover}                                  // Address of the cover image
          alt=""                                            // Changed: empty, the title is already written below
          className="w-full aspect-[2/3] object-cover rounded" // Portrait format, cropped without distortion
          loading="lazy"                                    // Loads only when visible (eco-design)
        />
      ) : (
        // No cover: grey block with the title in the middle
        // Changed: aria-hidden, so screen readers don't read the title twice
        <div
          className="w-full aspect-[2/3] bg-gray-200 rounded flex items-center justify-center p-2 text-center text-sm"
          aria-hidden="true"
        >
          {book.title}
        </div>
      )}

      {/* Book title, in bold */}
      <p className="mt-2 font-semibold">{book.title}</p>
      {/* Year only if known */}
      {book.year && <p className="text-sm text-gray-500">{book.year}</p>}
    </Link>
  );
}