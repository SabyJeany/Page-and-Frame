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
    // <main>: the main content of the page
    // max-w-sm: narrow width / mx-auto: centered / p-8: inner spacing
    <main className="max-w-sm mx-auto p-8">

      {/* <h1>: the main title of the page */}
      {/* text-2xl: big text / font-bold: bold / mb-4: space below */}
      <h1 className="text-2xl font-bold mb-4">Log in</h1>

      {/* <form>: the login form; onSubmit runs handleSubmit when the user clicks "Log in" */}
      {/* flex flex-col: elements stacked in a column / gap-3: space between them */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* <label>: the name of the field; htmlFor links it to the input with id="email" */}
        {/* Accessibility: a screen reader reads "Email" when the user is on the field */}
        <label htmlFor="email">Email</label>

        {/* <input>: the email field (self-closing tag, ends with /) */}
        <input
          id="email"                                  // Unique name, linked to the label above
          type="email"                                // Email field: the browser checks the format and shows an email keyboard on mobile
          className="border p-2"                      // border: frame around the field / p-2: inner spacing
          value={email}                               // Controlled input: React holds the value
          onChange={(e) => setEmail(e.target.value)}  // At each keystroke, update the email state
          autoComplete="email"                        // Lets the browser suggest a saved email
          required                                    // The browser refuses to send the form if the field is empty
        />

        {/* Label of the password field, linked to the input with id="password" */}
        <label htmlFor="password">Password</label>

        {/* <input>: the password field */}
        <input
          id="password"                                  // Unique name, linked to the label above
          type="password"                                // Hides the characters as they are typed
          className="border p-2"
          value={password}                               // Controlled input: React holds the value
          onChange={(e) => setPassword(e.target.value)}  // At each keystroke, update the password state
          autoComplete="current-password"                // Lets the password manager fill in the saved password
          required                                       // The field cannot be empty
        />

        {/* <button>: type="submit" sends the form (and runs handleSubmit) */}
        {/* bg-black: black background / text-white: white text / p-2: inner spacing */}
        <button type="submit" className="bg-black text-white p-2">
          Log in
        </button>

        {/* <p>: the error message, shown only if there is one (&& = "only if") */}
        {/* role="status": screen readers announce the message when it appears */}
        {message && <p role="status">{message}</p>}
      </form>
    </main>
  );
}