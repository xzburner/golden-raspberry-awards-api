import { Router } from 'express';
import type { ProducerRepository } from '../../repositories/producer-repository.js';
import { methodNotAllowed } from '../middlewares/method-not-allowed.js';

export function producerRoutes(producers: ProducerRepository): Router {
  const router = Router();

  router
    .route('/award-intervals')
    .get((_req, res) => {
      res.status(200).json(producers.findAwardIntervalExtremes());
    })
    .all(methodNotAllowed(['GET', 'HEAD']));

  return router;
}
