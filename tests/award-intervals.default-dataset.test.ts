import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApplication, type Application } from '../src/application.js';
import { DEFAULT_CSV_PATH } from './helpers/test-application.js';

describe('GET /producers/award-intervals (dataset provided with the proposal)', () => {
  let application: Application;

  beforeAll(() => {
    application = createApplication(DEFAULT_CSV_PATH);
  });

  afterAll(() => application.close());

  it('returns the producers with the shortest and longest interval between consecutive awards', async () => {
    const response = await request(application.app)
      .get('/producers/award-intervals')
      .expect('Content-Type', /application\/json/)
      .expect(200);

    expect(response.body).toStrictEqual({
      min: [{ producer: 'Joel Silver', interval: 1, previousWin: 1990, followingWin: 1991 }],
      max: [{ producer: 'Matthew Vaughn', interval: 13, previousWin: 2002, followingWin: 2015 }],
    });
  });

  it('loads every movie from the CSV into the database on startup', async () => {
    const all = await request(application.app).get('/movies').expect(200);
    const winners = await request(application.app).get('/movies?winner=true').expect(200);

    expect(all.body).toHaveLength(206);
    expect(winners.body).toHaveLength(42);
  });

  it('stores the CSV fields of a movie, splitting studios and producers', async () => {
    const response = await request(application.app).get('/movies?year=1980&winner=true').expect(200);

    expect(response.body).toStrictEqual([
      {
        id: 1,
        year: 1980,
        title: "Can't Stop the Music",
        studios: ['Associated Film Distribution'],
        producers: ['Allan Carr'],
        winner: true,
      },
    ]);
  });
});
