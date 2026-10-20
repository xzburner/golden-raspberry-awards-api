import { Router } from 'express';
import type { MovieFilter, MovieRepository } from '../../repositories/movie-repository.js';
import { BadRequestError, NotFoundError } from '../errors.js';
import { methodNotAllowed } from '../middlewares/method-not-allowed.js';

export function movieRoutes(movies: MovieRepository): Router {
  const router = Router();

  router
    .route('/')
    .get((req, res) => {
      res.status(200).json(movies.findAll(parseFilter(req.query)));
    })
    .all(methodNotAllowed(['GET', 'HEAD']));

  router
    .route('/:id')
    .get((req, res) => {
      const id = parsePositiveInteger(req.params.id, 'id');
      const movie = movies.findById(id);
      if (!movie) throw new NotFoundError(`Movie ${id} not found`);
      res.status(200).json(movie);
    })
    .all(methodNotAllowed(['GET', 'HEAD']));

  return router;
}

function parseFilter(query: Record<string, unknown>): MovieFilter {
  const filter: MovieFilter = {};

  if (query.year !== undefined) {
    filter.year = parsePositiveInteger(query.year, 'year');
  }

  if (query.winner !== undefined) {
    if (query.winner !== 'true' && query.winner !== 'false') {
      throw new BadRequestError('Query parameter "winner" must be "true" or "false"');
    }
    filter.winner = query.winner === 'true';
  }

  return filter;
}

function parsePositiveInteger(value: unknown, name: string): number {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`Parameter "${name}" must be a positive integer`);
  }
  return parsed;
}
