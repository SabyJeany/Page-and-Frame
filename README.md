# Page & Frame

> *Every film has a story before the story.*

Page & Frame is a web application for people who love both films and books.
It shows where a film comes from: the book it was adapted from, its author, and the other films adapted from the same works.
Users can search films and books, rate them, and keep a personal list of what they want to watch or read.

Solo project carried out for the French professional title **Développeur Web et Web Mobile (RNCP level 5)**.

---

## Features

**Films (TMDB)**
- Search films by title
- Film page: poster, overview, directors and main cast
- "In the same saga" and "You may also like" blocks
- Actor / director page with their filmography

**Books (Open Library)**
- Search books by title (Films / Books toggle on the home page)
- Book page: cover, authors, description, subjects and editions
- Author page: photo, biography and books sorted by popularity

**Film ↔ book link (Wikidata)**
- "Based on": the book a film was adapted from, with a link to its Wikipedia article
- "Adapted for the screen": the films adapted from a book or from all the works of an author

**User account**
- Sign up, log in, log out (JWT)
- Rate a film or a book (1 to 5 stars) and change the rating
- Personal list: *to watch / watched* for films, *to read / read* for books
- Profile page: my list, my ratings, statistics, bio, public or private profile
- Delete my account and all my data (GDPR, right to erasure)

---

## Tech stack

| Part | Technologies |
| :- | :- |
| Front-end | React (Vite), React Router, Axios, Tailwind CSS |
| Back-end | Node.js, Express 5 (ES Modules) |
| Relational database | MySQL 8 (users, works, ratings, lists, follows) with `mysql2` |
| Cache | MongoDB Atlas with Mongoose (TTL index, 24 h) |
| Security | bcrypt (password hashing), JSON Web Token, prepared SQL statements, CORS |
| External APIs | TMDB, Open Library, Wikidata (SPARQL), Wikipedia |
| Tools | Git / GitHub, Postman, MySQL Workbench, MongoDB Compass, ESLint, Figma, Notion |

### Architecture

```
React (Vite, port 5173)
   │  Axios + JWT in the Authorization header
   ▼
Express API (port 5000)
   ├── MySQL ............ user data (accounts, ratings, lists)
   ├── MongoDB cache .... answers of the external APIs (24 h)
   └── External APIs .... TMDB · Open Library · Wikidata
```

Each back-end feature follows the same path: **route → controller (input checks, HTTP codes) → service (cache first, then the external API)**.

---

## Project structure

```
Page-and-Frame/
├── backend/
│   ├── config/          MySQL pool and MongoDB connection
│   ├── controllers/     input checks and HTTP responses
│   ├── database/        schema.sql (tables and constraints)
│   ├── middlewares/     authJwt.js (protected routes)
│   ├── models/          SQL queries (users, works, ratings, lists) and the Mongoose cache model
│   ├── routes/          one file per resource
│   ├── services/        TMDB, Open Library, Wikidata and cache
│   ├── utils/           password hashing and JWT helpers
│   └── server.js
├── frontend/
│   ├── public/          static files (TMDB logo)
│   └── src/
│       ├── components/  reusable blocks (FilmCard, BookCard, WorkActions, Navbar...)
│       ├── pages/       one file per URL
│       ├── services/    api.js (Axios instance and interceptor)
│       └── App.jsx      routes, navigation bar and footer
└── docs/
    └── tests/           Postman and browser screenshots
```

---

## Installation (local)

### Prerequisites

- Node.js 20 or later (developed with Node.js 24)
- MySQL 8
- A MongoDB database (local or MongoDB Atlas)
- A free TMDB account to get an API read access token

### 1. Clone the repository

```bash
git clone <repository-url>
cd Page-and-Frame
```

### 2. Back-end

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (it is ignored by Git, never commit it):

```env
# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=page_and_frame

# MongoDB (cache)
MONGO_URI=your_mongodb_connection_string

# JWT secret: generate a long random value with
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_long_random_secret

# TMDB API read access token
TMDB_READ_TOKEN=your_tmdb_read_token
```

The application does not start with default secrets: if a value is missing, fill in the `.env` file.

Create the database and its tables:

```bash
mysql -u root -p < database/schema.sql
```

> ⚠️ The script starts with `DROP TABLE IF EXISTS`: it is meant for local development only.
> Never run it on a database that holds real data.

Start the API:

```bash
npm run dev     # development, restarts on each change (node --watch)
npm start       # production
```

The API runs on `http://localhost:5000`. The terminal should show `Connected to MySQL` and `Connected to MongoDB`.

### 3. Front-end

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

| Command | Use |
| :- | :- |
| `npm run dev` | development server |
| `npm run build` | production build in `dist/` |
| `npm run lint` | code check with ESLint |

---

## API endpoints

Base URL: `http://localhost:5000/api` · 🔒 = requires a JWT (`Authorization: Bearer <token>`)

### Authentication

| Method | Route | Description |
| :- | :- | :- |
| POST | `/auth/register` | Create an account (`username`, `email`, `password`, `ageConfirmed`) |
| POST | `/auth/login` | Log in, returns a token valid for 24 h |
| GET | `/auth/me` 🔒 | My account information |

### Films and people (TMDB)

| Method | Route | Description |
| :- | :- | :- |
| GET | `/films/search?q=` | Search films |
| GET | `/films/:id` | Film details, directors and cast |
| GET | `/films/collection/:id` | Films of the same saga, sorted by release date |
| GET | `/films/:id/recommendations` | Up to 10 recommended films |
| GET | `/films/:id/origin` | Book(s) the film is based on (Wikidata) |
| GET | `/persons/:id` | Actor or director with filmography |

### Books and authors (Open Library)

| Method | Route | Description |
| :- | :- | :- |
| GET | `/books/search?q=` | Search books |
| GET | `/books/:id` | Book details, authors and editions |
| GET | `/books/:id/adaptations` | Films adapted from this book |
| GET | `/authors/:id` | Author details and works |
| GET | `/authors/:id/adaptations` | Films adapted from the author's works |

### Ratings, lists and account

| Method | Route | Description |
| :- | :- | :- |
| POST | `/reviews` 🔒 | Rate a film or a book, or update the rating |
| GET | `/reviews/me` 🔒 | My ratings |
| GET | `/reviews/:type/:idExterne` | Average rating and public reviews of a work |
| POST | `/lists` 🔒 | Add a work to my list, or change its status |
| GET | `/lists/me?statut=` 🔒 | My list (optional status filter) |
| DELETE | `/lists/:type/:idExterne` 🔒 | Remove a work from my list |
| PATCH | `/users/me` 🔒 | Update my bio, avatar or profile visibility |
| DELETE | `/users/me` 🔒 | Delete my account (password required) |

Main status codes: `200` OK · `201` created · `204` deleted · `400` invalid input · `401` not logged in or wrong credentials · `404` not found · `409` already exists · `500` server error.

---

## Security and GDPR

- Passwords are hashed with **bcrypt** (10 salt rounds), never stored in plain text.
- **JWT** signed with a secret from `.env`, valid for 24 h. The user id always comes from the token, never from the request body.
- **Prepared SQL statements** (`?`) on every query, against SQL injection.
- Every input is checked before any database or API call (ids, rating 1 to 5, text lengths, https-only avatar links).
- The same `401` message for an unknown email and a wrong password.
- API keys and secrets only in the back-end `.env`, ignored by Git.
- **GDPR**: data minimisation (an "I am at least 15" checkbox instead of a birth date), private profiles, account deletion with `ON DELETE CASCADE`.

## Accessibility

- Every form field has a linked `<label>`; every image has an `alt` text.
- `role="alert"` / `role="status"` and `aria-live` for messages read by screen readers.
- `aria-pressed` on toggle buttons, `aria-current` on the current menu link.
- Semantic HTML: `header`, `nav`, `main`, `section`, real tables and description lists.
- Responsive, mobile-first layout with Tailwind.

---

## Tests

- Every route was tested with **Postman** (success and error cases: 400, 401, 404, 409). The collection is named *Page & Frame*.
- The Wikidata SPARQL queries were first tested on [query.wikidata.org](https://query.wikidata.org) before being coded.
- Screenshots of the tests are in `docs/tests/`.

---

## Git workflow

- One branch per feature (`feature/...`, `docs/...`), merged into `main` once tested.
- Conventional commit messages: `feat`, `fix`, `docs`, `chore`.

---

## Known limits and next steps

- Deployment (front-end, back-end and MySQL) and its documentation: in progress.
- Social features (follow users, friends' activity): planned if time allows.
- The profile average mixes film and book ratings; next step: two separate averages.
- Some Open Library editions have no cover; a grey block with the title is shown instead.
- Book → film matching compares titles, so a very different title between Open Library and Wikidata may be missed.

---

## Data sources and attribution

<img src="frontend/public/tmdb-logo.svg" alt="TMDB logo" width="120">

This product uses the TMDB API but is not endorsed or certified by TMDB.

- Film data: [The Movie Database (TMDB)](https://www.themoviedb.org)
- Book data: [Open Library](https://openlibrary.org)
- Film origins and adaptations: [Wikidata](https://www.wikidata.org) and [Wikipedia](https://www.wikipedia.org)

---

## Author

**Jeany** — Développeur Web et Web Mobile training, 2026.
