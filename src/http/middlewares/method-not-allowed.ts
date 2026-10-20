import type { RequestHandler } from 'express';

/** Answers 405 with the Allow header for verbs a resource does not support. */
export function methodNotAllowed(allowed: string[]): RequestHandler {
  const allow = allowed.join(', ');
  return (req, res) => {
    res
      .status(405)
      .set('Allow', allow)
      .json({ status: 405, error: `Method ${req.method} not allowed. Allowed: ${allow}` });
  };
}
