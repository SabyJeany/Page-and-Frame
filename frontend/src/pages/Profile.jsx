import { useEffect, useState } from 'react';
// Navigate: redirects while rendering; useNavigate: redirects from the code
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../services/api';
// Tile that shows a film or a book from its id only
import WorkTile from '../components/WorkTile';
import ProfileStats from '../components/ProfileStats';

// One block per list status, shown in this order
// Written outside the component: it never changes, so it is not recreated at each render
const SECTIONS = [
  { statut: 'a_voir', title: 'Films to watch' },
  { statut: 'vu', title: 'Films watched' },
  { statut: 'a_lire', title: 'Books to read' },
  { statut: 'lu', title: 'Books read' },
];

/**
 * Profile page (logged-in users only):
 * my info, edit my profile, my list, my ratings, delete my account.
 *
 * @returns {JSX.Element} The profile page, a redirection, a loading or an error message
 */
export default function Profile() {
  // Lets us change page from the code
  const navigate = useNavigate();
  // Logged in = a token is saved in the browser (Boolean turns it into true / false)
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  // Data loaded from the back-end
  const [user, setUser] = useState(null);     // My info (null until loaded)
  const [list, setList] = useState([]);       // My list (to watch, watched, to read, read)
  const [reviews, setReviews] = useState([]); // My ratings

  // Profile form (controlled inputs)
  const [bio, setBio] = useState('');
  const [profilPublic, setProfilPublic] = useState(true);
  const [message, setMessage] = useState('');

  // Delete form
  const [password, setPassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // Load my info, my list and my ratings at the same time
  useEffect(() => {
    // Not logged in: nothing to load (the redirection is handled below)
    if (!isLoggedIn) return;

    // Promise.all: the 3 requests start together; results come back in the same order
    Promise.all([api.get('/auth/me'), api.get('/lists/me'), api.get('/reviews/me')])
      .then(([me, myList, myReviews]) => {
        setUser(me.data);
        // Fill the form with the saved values ('' if no bio yet)
        setBio(me.data.bio || '');
        setProfilPublic(me.data.profilPublic);
        setList(myList.data);
        setReviews(myReviews.data);
      })
      .catch((err) => {
        // 401 = token expired or invalid: log out and go to the login page
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setMessage('Server error, please try again.');
        }
      });
  }, [isLoggedIn, navigate]);

  /**
   * Saves the bio and the public / private setting (PATCH /api/users/me).
   * @param {Event} e - The submit event
   */
  async function saveProfile(e) {
    // Stop the browser from reloading the page
    e.preventDefault();
    try {
      // Empty bio is sent as null (= erase it)
      await api.patch('/users/me', { bio: bio.trim() || null, profilPublic });
      setMessage('Profile updated.');
    } catch (err) {
      // Show the back-end message if there is one
      setMessage(err.response?.data?.message || 'Server error, please try again.');
    }
  }

  /**
   * Deletes the account after a confirmation and the password (DELETE /api/users/me).
   * @param {Event} e - The submit event
   */
  async function deleteAccount(e) {
    e.preventDefault();
    // Second confirmation in a browser dialog: this cannot be undone
    if (!window.confirm('Delete your account and all your data? This cannot be undone.')) return;
    try {
      // axios.delete sends a body only inside "data"
      await api.delete('/users/me', { data: { password } });
      // Account deleted: remove the token and go back to the home page
      localStorage.removeItem('token');
      navigate('/');
    } catch (err) {
      setDeleteMessage(err.response?.data?.message || 'Server error, please try again.');
    } finally {
      // Changed: always clear the password field, success or error
      setPassword('');
    }
  }

  // Not logged in: redirect to the login page
  // replace: the profile page is not kept in the history (the Back button does not loop)
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // Not loaded yet: error message if there is one, otherwise "Loading..."
  if (!user) {
    return message
      ? <p role="alert" className="p-8">{message}</p>
      : <p role="status" className="p-8">Loading...</p>;
  }

  return (
    // <main>: the main content of the page
    <main className="max-w-5xl mx-auto p-8">
      {/* <h1>: the main title = my username */}
      <h1 className="text-3xl font-bold">{user.username}</h1>
      {/* My email: shown only here, on my own profile */}
      <p className="text-gray-600 mb-8">{user.email}</p>
      {/* Profile stats: number of films and books in the list, number of ratings */}
      <ProfileStats list={list} reviews={reviews} />

      {/* 1. Edit my profile */}
      <form onSubmit={saveProfile} className="flex flex-col gap-3 max-w-lg mb-12">
        <label htmlFor="bio" className="font-semibold">Bio</label>
        {/* <textarea>: a text box on several lines; maxLength matches VARCHAR(500) in MySQL */}
        <textarea
          id="bio"
          className="border p-2"
          rows={3}
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        {/* Live character counter */}
        <p className="text-xs text-gray-500">{bio.length}/500</p>

        {/* Checkbox inside its label: clicking the text also checks the box */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profilPublic}
            onChange={(e) => setProfilPublic(e.target.checked)}
          />
          Public profile (other users can see my reviews)
        </label>

        <button type="submit" className="bg-black text-white p-2 self-start px-4">Save</button>
        {/* role="status": the message is announced by screen readers */}
        {message && <p role="status" className="text-sm">{message}</p>}
      </form>

      {/* 2. My list: one block per status, empty blocks are hidden */}
      {SECTIONS.map(({ statut, title }) => {
        // Keep only the items with this status
        const items = list.filter((item) => item.statut === statut);
        // Nothing for this status: show nothing
        if (items.length === 0) return null;

        return (
          <section key={statut} className="mb-10">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            {/* Grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {items.map((item) => (
                // Unique key: type + id (a film and a book could have the same id)
                <li key={`${item.type}-${item.id_externe}`}>
                  <WorkTile type={item.type} idExterne={item.id_externe} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {/* Whole list empty: a short message instead of nothing */}
      {list.length === 0 && <p className="mb-10 text-gray-600">Your list is empty for now.</p>}

      {/* 3. My ratings, only if there is at least one */}
      {reviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">My ratings</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {reviews.map((review) => (
              <li key={`${review.type}-${review.id_externe}`}>
                <WorkTile type={review.type} idExterne={review.id_externe} />
                {/* Stars: repeat draws full stars, then empty ones up to 5
                    Changed: role="img" so aria-label is read instead of the star symbols */}
                <p role="img" aria-label={`Rated ${review.note} out of 5`}>
                  {'★'.repeat(review.note)}{'☆'.repeat(5 - review.note)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Delete my account (GDPR, right to erasure); red border = danger zone */}
      <section className="border border-red-300 rounded p-4 max-w-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Delete my account</h2>
        <p className="text-sm mb-3">Your ratings, your list and your account will be deleted for good.</p>

        <form onSubmit={deleteAccount} className="flex flex-col gap-2">
          <label htmlFor="delete-password">Confirm with your password</label>
          <input
            id="delete-password"
            type="password"
            className="border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" className="bg-red-700 text-white p-2 self-start px-4">Delete my account</button>
          {/* role="alert": the error is announced right away */}
          {deleteMessage && <p role="alert" className="text-sm text-red-700">{deleteMessage}</p>}
        </form>
      </section>
    </main>
  );
}