// Import Link: React's version of the <a> tag (changes page without reloading)
import { Link } from 'react-router-dom';

/**
 * Directors and main actors of a film. Each name links to the person page.
 *
 * @param {Object} props
 * @param {Array<Object>} props.directors - [{ id, name }]
 * @param {Array<Object>} props.cast - [{ id, name, character, photo }]
 * @returns {JSX.Element} The "Directed by" line and the cast grid
 */
export default function CastList({ directors = [], cast = [] }) {
  // Default values ([]) so .map never crashes if a prop is missing
  return (
    // <section>: groups this part of the page.
    // aria-labelledby gives the section a name for screen readers:
    // it points to the element whose id is "cast-title" (the "Cast" heading),
    // so a screen reader announces "Cast section" instead of just "section".
    // The visible heading is reused, so the name is not written twice.
    // Only linked when the heading exists (undefined = attribute not added)
    <section
      aria-labelledby={cast.length > 0 ? 'cast-title' : undefined}
      className="mt-8"
    >
      {/* "Directed by" line, only if there is at least one director */}
      {directors.length > 0 && (
        // <p>: a paragraph of text
        <p className="mb-4">
          {/* <span>: a piece of text inside the line, here in bold */}
          <span className="font-semibold">Directed by </span>

          {/* One <span> per director; index = position in the list (0, 1, 2...) */}
          {directors.map((director, index) => (
            <span key={director.id}>
              {/* Comma before each name except the first one */}
              {index > 0 && ', '}
              {/* Link to the director's page, e.g. /persons/137427 */}
              <Link to={`/persons/${director.id}`} className="underline">
                {director.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      {/* Title and grid shown only if there are actors */}
      {cast.length > 0 && (
        // <> </>: fragment, groups elements without adding an extra tag
        <>
          {/* <h2>: section title. Its id "cast-title" is the target of aria-labelledby above */}
          <h2 id="cast-title" className="text-xl font-bold mb-2">Cast</h2>

          {/* <ul>: list without numbers; 3 columns on mobile, 5 on larger screens */}
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {cast.map((actor) => (
              // <li>: one item of the list = one actor
              // key: id + character, because an actor can play two roles
              <li key={`${actor.id}-${actor.character}`}>
                {/* The whole card is a link to the actor's page; slightly faded on hover */}
                <Link to={`/persons/${actor.id}`} className="block hover:opacity-80">
                  {/* Photo if TMDB has one, otherwise a grey rectangle */}
                  {actor.photo ? (
                    <img
                      src={actor.photo}               // Address of the image
                      alt=""                          // Empty: the name is already written below (decorative image)
                      className="w-full aspect-[2/3] object-cover rounded" // Portrait format, cropped without distortion
                      loading="lazy"                  // Loads only when visible (eco-design)
                    />
                  ) : (
                    // <div>: neutral box; aria-hidden = ignored by screen readers (decoration)
                    <div className="w-full aspect-[2/3] bg-gray-200 rounded" aria-hidden="true" />
                  )}

                  {/* Actor name */}
                  <p className="mt-1 text-sm font-semibold">{actor.name}</p>
                  {/* Character played, only if known */}
                  {actor.character && <p className="text-xs text-gray-500">{actor.character}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}