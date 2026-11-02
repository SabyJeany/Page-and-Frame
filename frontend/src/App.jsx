// Import the React Router components used for navigation between pages
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Import the pages of the application
import Search from './pages/Search';
import Register from './pages/Register';
import Login from './pages/Login';
import FilmDetail from './pages/FilmDetail';

/**
 * Root component of the application.
 * Sets up the router, the navigation bar, the routes (URL → page) and the footer.
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
        {/* Search page (home) */}
        <Route path="/" element={<Search />} />
        {/* Sign-up page */}
        <Route path="/register" element={<Register />} />
        {/* Login page */}
        <Route path="/login" element={<Login />} />
        {/* Film details page, e.g. /films/438631 */}
        <Route path="/films/:id" element={<FilmDetail />} />
        {/* Any other URL: "page not found" (kept last for readability) */}
        <Route path="*" element={<h1 className="p-8 text-2xl">Page not found</h1>} />
      </Routes>

      {/* Footer, visible on every page: data sources (TMDB attribution is required) */}
      <footer className="p-4 border-t text-sm text-gray-600">
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p>Book data from Open Library. Film origins from Wikidata and Wikipedia.</p>
      </footer>
    </BrowserRouter>
  );
}