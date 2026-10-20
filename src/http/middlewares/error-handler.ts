import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError, NotFoundError } from '../errors.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : (error?.status ?? 500);

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    status,
    error: status >= 500 ? 'Internal server error' : error.message,
  });
};
