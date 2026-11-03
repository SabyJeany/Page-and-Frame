import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
// Reusable card that shows one film (poster, title, year)
import FilmCard from '../components/FilmCard';

/**
 * Removes films that appear twice (same tmdbId) and keeps the first one.
 * TMDB can list the same film twice, e.g. when an actor plays two roles.
 *
 * @param {Array<Object>} [films=[]] - The list of films
 * @returns {Array<Object>} The list without duplicates
 */
function uniqueFilms(films = []) {
  // A Set is a box that can only contain each value once
  const seen = new Set();
  return films.filter((film) => {
    // Already seen: remove this film from the list
    if (seen.has(film.tmdbId)) return false;
    // First time: remember its id and keep the film
    seen.add(film.tmdbId);
    return true;
  });
}

/**
 * Turns a TMDB date into readable text: "1967-10-03" → "3 October 1967".
 *
 * @param {string} date - Date in the format YYYY-MM-DD
 * @returns {string} The formatted date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC', // Added: avoids showing the previous day in some time zones
  });
}

/**
 * Person page (actor or director): shows data from GET /api/persons/:id.
 *
 * @returns {JSX.Element} The person page, a loading message or an error
 */
export default function PersonDetail() {
  // The id in the URL, e.g. /persons/525 → "525"
  const { id } = useParams();
  // The person's data (null until the response arrives)
  const [person, setPerson] = useState(null);
  // Error message, if the request fails
  const [error, setError] = useState('');

  // Load the person when the page opens, and again each time the id changes
  useEffect(() => {
    // Reset: avoids showing the previous person for a moment
    setPerson(null);
    setError('');
    api.get(`/persons/${id}`)
      .then((response) => setPerson(response.data))
      .catch((err) => {
        // 404 (unknown) or 400 (invalid id) → "not found"; anything else → server problem
        const status = err.response?.status;
        setError(status === 404 || status === 400 ? 'Person not found.' : 'Server error, please try again.');
      });
  }, [id]);

  // 1. Error: role="alert" is announced right away by screen readers
  if (error) return <p role="alert" className="p-8">{error}</p>;
  // 2. Still loading
  if (!person) return <p role="status" className="p-8">Loading...</p>;

  // 3. Person loaded: prepare the two film lists without duplicates
  const directed = uniqueFilms(person.directedFilms);
  const acted = uniqueFilms(person.actingFilms);

  // Show first the list that matches the person's main job
  const sections = [
    { title: 'Directed', films: directed },
    { title: 'Acted in', films: acted },
  ];
  // Not mainly a director (e.g. an actor): put "Acted in" first
  if (person.knownFor !== 'Directing') sections.reverse();

  return (
    // <main>: the main content of the page
    <main className="max-w-5xl mx-auto p-8">

      {/* Top of the page: photo + info, stacked on mobile, side by side on larger screens */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">

        {/* Photo only if TMDB has one; alt describes the image */}
        {person.photo && (
          <img
            src={person.photo}
            alt={`Photo of ${person.name}`}
            className="w-48 rounded self-start" // self-start: the photo is not stretched
          />
        )}

        <section>
          {/* <h1>: the main title of the page = the person's name */}
          <h1 className="text-3xl font-bold">{person.name}</h1>

          {/* Birth date only if known, with the place if known */}
          {person.birthday && (
            <p className="text-gray-600">
              Born on {formatDate(person.birthday)}
              {person.placeOfBirth && ` in ${person.placeOfBirth}`}
            </p>
          )}

          {/* Biography; whitespace-pre-line keeps the line breaks from TMDB */}
          {person.biography && <p className="mt-4 whitespace-pre-line">{person.biography}</p>}
        </section>
      </div>

      {/* Filmography: one section per list, skipping empty lists */}
      {sections
        .filter((section) => section.films.length > 0)
        .map((section) => (
          <section key={section.title} className="mb-10">
            {/* <h2>: sub-title, e.g. "Directed" or "Acted in" */}
            <h2 className="text-xl font-bold mb-4">{section.title}</h2>

            {/* Film grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {section.films.map((film) => (
                // One <li> per film; tmdbId is unique thanks to uniqueFilms
                <li key={film.tmdbId}>
                  <FilmCard film={film} />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}