CREATE DATABASE IF NOT EXISTS page_and_frame CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE page_and_frame;

DROP TABLE IF EXISTS suivre;
DROP TABLE IF EXISTS adaptation;
DROP TABLE IF EXISTS liste;
DROP TABLE IF EXISTS critique;
DROP TABLE IF EXISTS oeuvre;
DROP TABLE IF EXISTS utilisateur;

CREATE TABLE utilisateur (
  id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
  pseudo VARCHAR(30) NOT NULL UNIQUE, -- Username: required, 30 CHARACTERS MAX, only one pseudo per user
  email VARCHAR(255) NOT NULL UNIQUE, -- Login email: required, one account per email
  mot_de_passe VARCHAR(255) NOT NULL, -- bcrypt hash (60 characters), never the plain password; 255 = margin
  date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Sign-up date, filled automatically
  avatar VARCHAR(255) NULL, -- Avatar Link:(https only, checked by the back-end) optional, can be NULL
  bio VARCHAR(500) NULL, -- Short bio, optional, can be NULL
  profil_public BOOLEAN NOT NULL DEFAULT TRUE, -- The user can choose to make their profile public or private, but default is public
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user' -- ENUM is a list , 'user' by default
);

-- Links our internal id to the external API id (TMDB for films, Open Library for books)
-- One table for both films and books: reviews, list and adaaptations all point to this table
CREATE TABLE oeuvre (
  id_oeuvre INT AUTO_INCREMENT PRIMARY KEY, -- Internal id, created by MySQL
  type ENUM('film', 'livre') NOT NULL, -- Kind of work: film or book
  id_externe VARCHAR(50) NOT NULL, -- TMDB id (e.g. 438631) or Open Library id (e.g. 0L893414W)
  UNIQUE (type, id_externe) -- The same work cannot be stored twice
);

CREATE TABLE critique (
  id_critique INT AUTO_INCREMENT PRIMARY KEY, -- Internal id of the critique, created by MySQL
  note TINYINT NOT NULL CHECK (note BETWEEN 1 AND 5), -- TINYINT = any very small integer , CHECK = a constraint that checks the value.
  commentaire TEXT NULL, -- Comment on the work, optional, can be NULL
  date_critique DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Date of the critique, filled automatically (DEFAULT)
  id_utilisateur INT NOT NULL, -- Internal id of the user who wrote the critique
  id_oeuvre INT NOT NULL, -- Which oeuvre ti is about
  UNIQUE (id_utilisateur, id_oeuvre), -- One user can only write one critique per work. one oeuvre can have many critiques.
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE, -- If a user is deleted, their critiques are also deleted
  FOREIGN KEY (id_oeuvre) REFERENCES oeuvre(id_oeuvre)
);

-- Lists of each user: to watch, watched, to read, read.
CREATE TABLE liste (
  id_liste INT AUTO_INCREMENT PRIMARY KEY, -- AUTO_INCREMENT = automatically incremented by MySQL, PRIMARY KEY = unique identifier for each row
  statut ENUM('a_voir', 'vu', 'a_lire', 'lu') NOT NULL,
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_utilisateur INT NOT NULL, -- Internal id of the user who added the work to their list
  id_oeuvre INT NOT NULL, -- which work is in the list
  UNIQUE (id_utilisateur, id_oeuvre), -- one oeuvre can only be in one list per user. A work may only appear once in the list, regardless of its status
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_oeuvre) REFERENCES oeuvre(id_oeuvre)
);

-- Manual links "this film is adapted from this book" (backup when Wikidata is incomplete)
CREATE TABLE adaptation (
  id_adaptation INT AUTO_INCREMENT PRIMARY KEY, -- Internal id of each link of adaptation, created by MySQL. AUTO_INCREMENT = automatically incremented by MySQL, PRIMARY KEY = unique identifier for each row
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Date and time when the adaptation link was added, filled automatically (DEFAULT)
  id_livre INT NOT NULL, -- Internal id of the book being adapted
  id_film INT NOT NULL UNIQUE, -- Internal id of the film adaptation
  FOREIGN KEY (id_livre) REFERENCES oeuvre(id_oeuvre), -- References the oeuvre table
  FOREIGN KEY (id_film) REFERENCES oeuvre(id_oeuvre) -- References the oeuvre table
);

-- Reflective relationship: When a table was related to itself.
CREATE TABLE suivre (
  id_suiveur INT NOT NULL, -- Internal id of the user who is following another user
  id_suivi INT NOT NULL, -- Internal id of the user who is being followed
  date_suivi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Date and time when the follow relationship was created
  PRIMARY KEY (id_suiveur, id_suivi), -- Composite key: you can follow someone only once.
  -- If one of the two users is deleted, the follow is deleted too
  FOREIGN KEY (id_suiveur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_suivi) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);