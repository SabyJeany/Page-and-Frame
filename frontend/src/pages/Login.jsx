import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Login page: sends the form to POST /api/auth/login and keeps the token.
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Lets us change page from the code

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      // Keep the token in the browser for the next requests
      localStorage.setItem('token', response.data.token);
      navigate('/'); // Go to the home page
    } catch (err) {
      setMessage(err.response?.data?.message || 'Server error');
    }
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" className="bg-black text-white p-2">
          Log in
        </button>

        {message && <p role="status">{message}</p>}
      </form>
    </main>
  );
}