// Import the React Router components used for navigation between pages
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import the pages of the application
import Search from './pages/Search';
import Register from './pages/Register';
import Login from './pages/Login';
import FilmDetail from './pages/FilmDetail';
import PersonDetail from './pages/PersonDetail';
import BookDetail from './pages/BookDetail';
import AuthorDetail from './pages/AuthorDetail';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

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
      {/* The navigation bar is visible on every page */}
      <Navbar />

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

        {/* Person details page, e.g. /persons/525 */}
        <Route path="/persons/:id" element={<PersonDetail />} />

        {/* Book details page, e.g. /books/OL893414W */}
        <Route path="/books/:id" element={<BookDetail />} />

        {/* Author details page, e.g. /authors/OL23919A */}
        <Route path="/authors/:id" element={<AuthorDetail />} />

        {/* User profile page, e.g. /profile/1 */}
        <Route path="/profile/" element={<Profile />} />

        {/* Any other URL: "page not found" (kept last for readability) */}
        <Route path="*" element={<h1 className="p-8 text-2xl">Page not found</h1>} />
      </Routes>

      {/* Footer, visible on every page: data sources (TMDB attribution is required) */}
      <footer className="p-4 border-t text-sm text-gray-600">
      <img src="/tmdb-logo.svg" alt="TMDB logo" className="h-4 w-auto mb-2" /> 
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p>Book data from Open Library. Film origins from Wikidata and Wikipedia.</p>
      </footer>
    </BrowserRouter>
  );
}