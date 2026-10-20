import { inTransaction, type DatabaseConnection } from '../database/connection.js';
import type { MovieRecord } from './movie-csv-reader.js';

/** Persists movie records (and their studios/producers) in a single transaction. */
export function importMovies(db: DatabaseConnection, movies: MovieRecord[]): void {
  const insertMovie = db.prepare('INSERT INTO movies (year, title, winner) VALUES (?, ?, ?) RETURNING id');
  // Upsert that always returns the id, whether the row is new or already existed.
  const upsertStudio = db.prepare(
    'INSERT INTO studios (name) VALUES (?) ON CONFLICT (name) DO UPDATE SET name = excluded.name RETURNING id',
  );
  const upsertProducer = db.prepare(
    'INSERT INTO producers (name) VALUES (?) ON CONFLICT (name) DO UPDATE SET name = excluded.name RETURNING id',
  );
  const linkStudio = db.prepare('INSERT OR IGNORE INTO movie_studios (movie_id, studio_id) VALUES (?, ?)');
  const linkProducer = db.prepare(
    'INSERT OR IGNORE INTO movie_producers (movie_id, producer_id) VALUES (?, ?)',
  );

  const idOf = (row: unknown): number => (row as { id: number }).id;

  inTransaction(db, () => {
    for (const movie of movies) {
      const movieId = idOf(insertMovie.get(movie.year, movie.title, movie.winner ? 1 : 0));

      for (const studio of movie.studios) {
        linkStudio.run(movieId, idOf(upsertStudio.get(studio)));
      }
      for (const producer of movie.producers) {
        linkProducer.run(movieId, idOf(upsertProducer.get(producer)));
      }
    }
  });
}
