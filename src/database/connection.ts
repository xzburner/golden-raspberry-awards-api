import { DatabaseSync } from 'node:sqlite';

export type DatabaseConnection = DatabaseSync;

const SCHEMA = `
  CREATE TABLE movies (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    year    INTEGER NOT NULL,
    title   TEXT    NOT NULL,
    winner  INTEGER NOT NULL DEFAULT 0 CHECK (winner IN (0, 1))
  );

  CREATE TABLE studios (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE
  );

  CREATE TABLE producers (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE
  );

  CREATE TABLE movie_studios (
    movie_id   INTEGER NOT NULL REFERENCES movies (id),
    studio_id  INTEGER NOT NULL REFERENCES studios (id),
    PRIMARY KEY (movie_id, studio_id)
  );

  CREATE TABLE movie_producers (
    movie_id     INTEGER NOT NULL REFERENCES movies (id),
    producer_id  INTEGER NOT NULL REFERENCES producers (id),
    PRIMARY KEY (movie_id, producer_id)
  );

  CREATE INDEX idx_movies_winner_year ON movies (winner, year);
  CREATE INDEX idx_movie_producers_producer ON movie_producers (producer_id);
`;

/**
 * Creates an embedded, in-memory SQLite database (Node.js built-in `node:sqlite`,
 * no native build or external install) with the application schema.
 * Each call returns an isolated database, which keeps tests independent.
 */
export function createDatabase(): DatabaseConnection {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

/** Runs `work` inside a transaction, rolling back if it throws. */
export function inTransaction<T>(db: DatabaseConnection, work: () => T): T {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
