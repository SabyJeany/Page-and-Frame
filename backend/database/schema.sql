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
  pseudo VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  avatar VARCHAR(255) NULL,
  bio VARCHAR(500) NULL,
  profil_public BOOLEAN NOT NULL DEFAULT TRUE,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
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
  id_critique INT AUTO_INCREMENT PRIMARY KEY,
  note TINYINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT NULL,
  date_critique DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_utilisateur INT NOT NULL,
  id_oeuvre INT NOT NULL,
  UNIQUE (id_utilisateur, id_oeuvre),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_oeuvre) REFERENCES oeuvre(id_oeuvre)
);

CREATE TABLE liste (
  id_liste INT AUTO_INCREMENT PRIMARY KEY,
  statut ENUM('a_voir', 'vu', 'a_lire', 'lu') NOT NULL,
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_utilisateur INT NOT NULL,
  id_oeuvre INT NOT NULL,
  UNIQUE (id_utilisateur, id_oeuvre),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_oeuvre) REFERENCES oeuvre(id_oeuvre)
);

CREATE TABLE adaptation (
  id_adaptation INT AUTO_INCREMENT PRIMARY KEY,
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_livre INT NOT NULL,
  id_film INT NOT NULL UNIQUE,
  FOREIGN KEY (id_livre) REFERENCES oeuvre(id_oeuvre),
  FOREIGN KEY (id_film) REFERENCES oeuvre(id_oeuvre)
);

CREATE TABLE suivre (
  id_suiveur INT NOT NULL,
  id_suivi INT NOT NULL,
  date_suivi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_suiveur, id_suivi),
  FOREIGN KEY (id_suiveur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_suivi) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);