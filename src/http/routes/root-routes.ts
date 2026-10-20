import { Router } from 'express';
import { methodNotAllowed } from '../middlewares/method-not-allowed.js';

/** API entry point: describes the available resources so clients can discover them. */
export function rootRoutes(): Router {
  const router = Router();

  router
    .route('/')
    .get((_req, res) => {
      res.status(200).json({
        name: 'Golden Raspberry Awards API',
        description: 'Nominees and winners of the Worst Picture category of the Golden Raspberry Awards.',
        links: {
          awardIntervals: { href: '/producers/award-intervals', method: 'GET' },
          movies: { href: '/movies{?year,winner}', method: 'GET', templated: true },
          movie: { href: '/movies/{id}', method: 'GET', templated: true },
        },
      });
    })
    .all(methodNotAllowed(['GET', 'HEAD']));

  return router;
}
