// Link: link without reloading; NavLink: a Link that knows if it points to the current page
// useLocation: gives the current URL; useNavigate: changes page from the code
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

/**
 * Main menu: shows Profile / Log out when logged in, Sign up / Log in otherwise.
 * Placed inside BrowserRouter in App.jsx, so it can use the router hooks.
 *
 * @returns {JSX.Element} The header with the navigation links
 */
export default function Navbar() {
  // Lets us change page from the code (after logging out)
  const navigate = useNavigate();

  // We don't use the value: calling useLocation is enough.
  // Each time the URL changes, React re-renders this component,
  // so the token below is read again (e.g. right after logging in).
  useLocation();

  // Logged in = a token is saved in the browser (Boolean turns it into true / false)
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  /**
   * Logs the user out: forgets the token, then goes back to the home page.
   * The JWT is not stored on the server, so removing it is enough.
   */
  function logout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  // NavLink gives { isActive }: true when the link points to the current page
  // Current page: bold and underlined; other pages: underlined on hover only
  const linkClass = ({ isActive }) => (isActive ? 'font-bold underline' : 'hover:underline');

  return (
    // <header>: the top of the site, visible on every page
    <header className="border-b">
      {/* <nav>: the menu; aria-label gives it a name for screen readers */}
      {/* flex-wrap: on a small phone, links go to the next line instead of overflowing */}
      <nav aria-label="Main menu" className="max-w-5xl mx-auto flex flex-wrap items-center gap-4 p-4">

        {/* Site name, links to the home page; mr-auto pushes the other links to the right */}
        <Link to="/" className="text-lg font-bold mr-auto">Page & Frame</Link>

        {/* Ternary: logged in ? (Profile + Log out) : (Sign up + Log in) */}
        {isLoggedIn ? (
          // <> </>: fragment, groups two elements without adding an extra tag
          <>
            {/* NavLink adds aria-current="page" on the current page (announced by screen readers) */}
            <NavLink to="/profile" className={linkClass}>Profile</NavLink>
            {/* <button> and not a link: logging out is an action, not a page */}
            <button type="button" onClick={logout} className="hover:underline">Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/register" className={linkClass}>Sign up</NavLink>
            <NavLink to="/login" className={linkClass}>Log in</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}