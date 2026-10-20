import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Application } from '../src/application.js';
import { createApplicationFromCsv } from './helpers/test-application.js';

describe('REST contract (Richardson maturity level 2)', () => {
  let application: Application;

  beforeAll(() => {
    application = createApplicationFromCsv([
      '1980;Movie A;Studio X, Studio Y;Producer 1 and Producer 2;yes',
      '1980;Movie B;Studio X;Producer 3;',
      '1981;Movie C;Studio Z;Producer 1;yes',
    ]);
  });

  afterAll(() => application.close());

  it('GET / returns 200 with links to the available resources', async () => {
    const response = await request(application.app).get('/').expect(200);

    expect(response.body.links).toStrictEqual({
      awardIntervals: { href: '/producers/award-intervals', method: 'GET' },
      movies: { href: '/movies{?year,winner}', method: 'GET', templated: true },
      movie: { href: '/movies/{id}', method: 'GET', templated: true },
    });
  });

  it('GET /movies/:id returns 200 with the movie resource', async () => {
    const response = await request(application.app).get('/movies/1').expect(200);

    expect(response.body).toStrictEqual({
      id: 1,
      year: 1980,
      title: 'Movie A',
      studios: ['Studio X', 'Studio Y'],
      producers: ['Producer 1', 'Producer 2'],
      winner: true,
    });
  });

  it('GET /movies filters by year and winner', async () => {
    const response = await request(application.app).get('/movies?year=1980&winner=false').expect(200);

    expect(response.body.map((movie: { title: string }) => movie.title)).toStrictEqual(['Movie B']);
  });

  it('returns 404 for a movie that does not exist', async () => {
    const response = await request(application.app).get('/movies/999').expect(404);
    expect(response.body).toStrictEqual({ status: 404, error: 'Movie 999 not found' });
  });

  it('returns 404 for an unknown route', async () => {
    await request(application.app).get('/unknown').expect(404);
  });

  it.each([
    ['/movies/abc'],
    ['/movies/0'],
    ['/movies?year=19x0'],
    ['/movies?winner=maybe'],
  ])('returns 400 for invalid parameters: %s', async (url) => {
    const response = await request(application.app).get(url).expect(400);
    expect(response.body.status).toBe(400);
  });

  it.each([
    ['post', '/'],
    ['post', '/producers/award-intervals'],
    ['put', '/producers/award-intervals'],
    ['delete', '/producers/award-intervals'],
    ['post', '/movies'],
    ['delete', '/movies/1'],
  ] as const)('returns 405 with the Allow header for %s %s', async (method, url) => {
    const response = await request(application.app)[method](url).expect(405);
    expect(response.headers.allow).toBe('GET, HEAD');
  });
});

describe('Startup', () => {
  it('fails fast when the CSV has an invalid year', () => {
    expect(() => createApplicationFromCsv(['abcd;Movie;Studio;Producer;yes'])).toThrow(
      'Invalid year "abcd" at line 2',
    );
  });

  it('fails fast when a required column is missing', () => {
    expect(() => createApplicationFromCsv(['1980;Movie;Producer;yes'], 'year;title;producers;winner')).toThrow(
      'missing required column(s): studios',
    );
  });
});
