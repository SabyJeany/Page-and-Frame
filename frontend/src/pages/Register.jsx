import { useState } from 'react';
import api from '../services/api';

/**
 * Sign-up page: sends the form to POST /api/auth/register.
 */
export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault(); // Stop the browser from reloading the page
    try {
      // Same field names as req.body in authController.js
      await api.post('/auth/register', { username, email, password, ageConfirmed });
      setMessage('Account created! You can now log in.');
    } catch (err) {
      // Show the message sent by the back-end (400, 409...)
      setMessage(err.response?.data?.message || 'Server error');
    }
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Create an account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Each input has a label linked by htmlFor/id (accessibility) */}
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          className="border p-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          minLength={3}
          maxLength={30}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password (8 characters minimum)</label>
        <input
          id="password"
          type="password"
          className="border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            required
          />
          I am at least 15 years old
        </label>

        <button type="submit" className="bg-black text-white p-2">
          Create account
        </button>

        {/* role="status": screen readers announce the message */}
        {message && <p role="status">{message}</p>}
      </form>
    </main>
  );
}