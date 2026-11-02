// Import the React Router components used for navigation between pages
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Search from './pages/Search';

// Import the pages of the application
import Register from './pages/Register';
import Login from './pages/Login';
import FilmDetails from './pages/FilmDetail';

/**
 * Root component of the application.
 * Sets up the router, the navigation bar and the routes (URL → page).
 *
 * @returns {JSX.Element} The whole application
 */
export default function App() {
  return (
    // BrowserRouter watches the URL; needed for Routes, Link and useNavigate
    <BrowserRouter>
      {/* Navigation bar, visible on every page (outside Routes) */}
      <nav aria-label="Main navigation" className="flex gap-4 p-4 border-b">
        {/* Link changes the page without reloading it (SPA) */}
        <Link to="/">Page & Frame</Link>
        <Link to="/register">Sign up</Link>
        <Link to="/login">Log in</Link>
      </nav>

      {/* Shows the page that matches the current URL */}
      <Routes>
        {/* Search page */}
        <Route path="/" element={<Search />} />
        {/* Sign-up page */}
        <Route path="/register" element={<Register />} />
        {/* Login page */}
        <Route path="/login" element={<Login />} />
        {/* Any other URL: "page not found" (must stay last) */}
        <Route path="*" element={<h1 className="p-8 text-2xl">Page not found</h1>} />
        {/* Film details page */}
        <Route path="/films/:id" element={<FilmDetails />} />
      </Routes>
    </BrowserRouter>
  );
}