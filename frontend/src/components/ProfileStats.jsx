/**
 * Statistics of the profile, computed from data already loaded (no API call).
 * The parent (Profile.jsx) already has the list and the ratings, so this block
 * only counts and calculates: no request, no loading, no error to handle.
 *
 * @param {Object} props
 * @param {Array<Object>} props.list - My list: [{ statut, type, id_externe }]
 * @param {Array<Object>} props.reviews - My ratings: [{ note, type, id_externe }]
 * @returns {JSX.Element} Four boxes: films watched, books read, ratings, average rating
 */
export default function ProfileStats({ list, reviews }) {
  // Count the films with the status "vu" (watched)
  // filter keeps the matching items, .length counts them
  const filmsWatched = list.filter((item) => item.statut === 'vu').length;
  // Count the books with the status "lu" (read)
  const booksRead = list.filter((item) => item.statut === 'lu').length;

  // Average rating: sum of the ratings / number of ratings, with one decimal
  // Ternary: at least one rating ? calculate : show a dash
  const average = reviews.length > 0
    // reduce adds up all the ratings, starting from 0
    // toFixed(1) keeps one decimal, e.g. 4.333 -> "4.3"
    ? (reviews.reduce((sum, review) => sum + review.note, 0) / reviews.length).toFixed(1)
    // No rating: a dash (avoids dividing by 0, which would show "NaN")
    : '—';

  // The four statistics, each with its label and its value
  // A list lets us build the four boxes with one single map below
  const stats = [
    { label: 'Films watched', value: filmsWatched },
    { label: 'Books read', value: booksRead },
    { label: 'Ratings', value: reviews.length },
    { label: 'Average rating', value: average },
  ];

  return (
    // <section> named with aria-label, for screen readers ("My statistics")
    <section aria-label="My statistics" className="mb-12">
      {/* <dl>: a list of terms (label) and their values, read in pairs by screen readers */}
      {/* Grid: 2 boxes per row on mobile, 4 on larger screens */}
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          // One box per statistic; the label is unique, so it can be the key
          <div key={stat.label} className="border rounded p-4 text-center">
            {/* <dt>: the term = the name of the statistic */}
            <dt className="text-sm text-gray-600">{stat.label}</dt>
            {/* <dd>: the description = the value, big and bold */}
            <dd className="text-2xl font-bold">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}