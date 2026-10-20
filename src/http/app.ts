import express, { type Express } from 'express';
import type { MovieRepository } from '../repositories/movie-repository.js';
import type { ProducerRepository } from '../repositories/producer-repository.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { movieRoutes } from './routes/movie-routes.js';
import { producerRoutes } from './routes/producer-routes.js';

export interface AppDependencies {
  movies: MovieRepository;
  producers: ProducerRepository;
}

export function createHttpApp({ movies, producers }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('json spaces', 2);

  app.use('/movies', movieRoutes(movies));
  app.use('/producers', producerRoutes(producers));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
