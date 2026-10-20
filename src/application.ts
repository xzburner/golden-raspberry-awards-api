import type { Express } from 'express';
import { createDatabase, type DatabaseConnection } from './database/connection.js';
import { createHttpApp } from './http/app.js';
import { readMovieCsv } from './importer/movie-csv-reader.js';
import { importMovies } from './importer/movie-importer.js';
import { MovieRepository } from './repositories/movie-repository.js';
import { ProducerRepository } from './repositories/producer-repository.js';

export interface Application {
  app: Express;
  db: DatabaseConnection;
  close(): void;
}

/**
 * Wires the application: creates the in-memory database, loads the CSV into it
 * and builds the HTTP layer on top of the repositories.
 */
export function createApplication(csvFilePath: string): Application {
  const db = createDatabase();
  try {
    importMovies(db, readMovieCsv(csvFilePath));
  } catch (error) {
    db.close();
    throw error;
  }

  const app = createHttpApp({
    movies: new MovieRepository(db),
    producers: new ProducerRepository(db),
  });

  return { app, db, close: () => db.close() };
}
