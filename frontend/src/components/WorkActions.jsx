import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Status buttons for each type of work (same values as the back-end)
const STATUTS = {
  film: [{ value: 'a_voir', label: 'To watch' }, { value: 'vu', label: 'Watched' }],
  livre: [{ value: 'a_lire', label: 'To read' }, { value: 'lu', label: 'Read' }],
};

/**
 * Rating stars and list buttons for a film or a book (logged-in users only).
 *
 * @param {string} props.type - 'film' or 'livre'
 * @param {string} props.idExterne - TMDB id or Open Library id
 */
export default function WorkActions({ type, idExterne }) {
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [note, setNote] = useState(null);     // My current rating
  const [statut, setStatut] = useState(null); // My current status in my list
  const [message, setMessage] = useState('');

  // Load my rating and my status for this work
  useEffect(() => {
    if (!isLoggedIn) return;
    const id = String(idExterne);

    Promise.all([api.get('/reviews/me'), api.get('/lists/me')])
      .then(([reviews, list]) => {
        const myReview = reviews.data.find((r) => r.type === type && r.id_externe === id);
        const myItem = list.data.find((l) => l.type === type && l.id_externe === id);
        setNote(myReview ? myReview.note : null);
        setStatut(myItem ? myItem.statut : null);
      })
      .catch(handleError);
  }, [type, idExterne, isLoggedIn]);

  // 401 = token missing or expired: ask the user to log in again
  function handleError(err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      setMessage('Your session has expired, please log in again.');
    } else {
      setMessage(err.response?.data?.message || 'Server error, please try again.');
    }
  }

  async function rate(value) {
    try {
      await api.post('/reviews', { type, idExterne: String(idExterne), note: value });
      setNote(value);
      setMessage('Rating saved.');
    } catch (err) {
      handleError(err);
    }
  }

  async function changeStatut(value) {
    try {
      await api.post('/lists', { type, idExterne: String(idExterne), statut: value });
      setStatut(value);
      setMessage('List updated.');
    } catch (err) {
      handleError(err);
    }
  }

  async function removeFromList() {
    try {
      await api.delete(`/lists/${type}/${idExterne}`);
      setStatut(null);
      setMessage('Removed from your list.');
    } catch (err) {
      handleError(err);
    }
  }

  if (!isLoggedIn) {
    return (
      <p className="mt-6">
        <Link to="/login" className="underline">Log in</Link> to rate this work and add it to your list.
      </p>
    );
  }

  return (
    <section aria-label="My rating and my list" className="mt-6 flex flex-col gap-3">
      {/* Rating: 5 buttons, the filled stars show my rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => rate(value)}
            aria-label={`Rate ${value} out of 5`}
            aria-pressed={note === value}
            className="text-2xl"
          >
            {note !== null && value <= note ? '★' : '☆'}
          </button>
        ))}
      </div>

      {/* List: one button per status, the active one is dark */}
      <div className="flex gap-2">
        {STATUTS[type].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => changeStatut(option.value)}
            aria-pressed={statut === option.value}
            className={`border px-3 py-1 ${statut === option.value ? 'bg-black text-white' : ''}`}
          >
            {option.label}
          </button>
        ))}
        {statut && (
          <button type="button" onClick={removeFromList} className="underline text-sm">
            Remove from my list
          </button>
        )}
      </div>

      {message && <p role="status" className="text-sm text-gray-600">{message}</p>}
    </section>
  );
}