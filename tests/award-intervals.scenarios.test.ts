import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import type { Application } from '../src/application.js';
import { createApplicationFromCsv } from './helpers/test-application.js';

/**
 * The evaluation uses other datasets, so these scenarios boot the full application
 * from different CSV files and assert the HTTP response.
 */
describe('GET /producers/award-intervals (other datasets)', () => {
  let application: Application | undefined;

  afterEach(() => application?.close());

  async function intervalsFor(lines: string[]) {
    application = createApplicationFromCsv(lines);
    const response = await request(application.app).get('/producers/award-intervals').expect(200);
    return response.body;
  }

  it('returns every producer tied on the min and on the max interval, ordered by producer', async () => {
    const body = await intervalsFor([
      '2008;Movie 1;Studio;Producer 1;yes',
      '2009;Movie 2;Studio;Producer 1;yes',
      '2018;Movie 3;Studio;Producer 2;yes',
      '2019;Movie 4;Studio;Producer 2;yes',
      '1900;Movie 5;Studio;Producer 3;yes',
      '1999;Movie 6;Studio;Producer 3;yes',
      '2000;Movie 7;Studio;Producer 4;yes',
      '2099;Movie 8;Studio;Producer 4;yes',
    ]);

    expect(body).toStrictEqual({
      min: [
        { producer: 'Producer 1', interval: 1, previousWin: 2008, followingWin: 2009 },
        { producer: 'Producer 2', interval: 1, previousWin: 2018, followingWin: 2019 },
      ],
      max: [
        { producer: 'Producer 3', interval: 99, previousWin: 1900, followingWin: 1999 },
        { producer: 'Producer 4', interval: 99, previousWin: 2000, followingWin: 2099 },
      ],
    });
  });

  it('considers only consecutive awards and returns the same producer in min and max', async () => {
    const body = await intervalsFor([
      '1990;Movie 1;Studio;Producer 1;yes',
      '1991;Movie 2;Studio;Producer 1;yes',
      '2001;Movie 3;Studio;Producer 1;yes',
      '2004;Movie 4;Studio;Producer 2;yes',
      '2008;Movie 5;Studio;Producer 2;yes',
    ]);

    expect(body).toStrictEqual({
      min: [{ producer: 'Producer 1', interval: 1, previousWin: 1990, followingWin: 1991 }],
      max: [{ producer: 'Producer 1', interval: 10, previousWin: 1991, followingWin: 2001 }],
    });
  });

  it('returns several intervals of the same producer when they tie', async () => {
    const body = await intervalsFor([
      '2000;Movie 1;Studio;Producer 1;yes',
      '2002;Movie 2;Studio;Producer 1;yes',
      '2004;Movie 3;Studio;Producer 1;yes',
    ]);

    const expected = [
      { producer: 'Producer 1', interval: 2, previousWin: 2000, followingWin: 2002 },
      { producer: 'Producer 1', interval: 2, previousWin: 2002, followingWin: 2004 },
    ];
    expect(body).toStrictEqual({ min: expected, max: expected });
  });

  it('does not depend on the order of the rows in the CSV', async () => {
    const body = await intervalsFor([
      '2015;Movie 1;Studio;Producer 1;yes',
      '1990;Movie 2;Studio;Producer 1;yes',
      '2002;Movie 3;Studio;Producer 1;yes',
    ]);

    expect(body).toStrictEqual({
      min: [{ producer: 'Producer 1', interval: 12, previousWin: 1990, followingWin: 2002 }],
      max: [{ producer: 'Producer 1', interval: 13, previousWin: 2002, followingWin: 2015 }],
    });
  });

  it('ignores nominated movies that did not win', async () => {
    const body = await intervalsFor([
      '2000;Movie 1;Studio;Producer 1;yes',
      '2001;Movie 2;Studio;Producer 1;',
      '2002;Movie 3;Studio;Producer 1;no',
      '2010;Movie 4;Studio;Producer 1;yes',
    ]);

    const expected = [{ producer: 'Producer 1', interval: 10, previousWin: 2000, followingWin: 2010 }];
    expect(body).toStrictEqual({ min: expected, max: expected });
  });

  it('splits producers separated by commas and "and", without breaking names containing "and"', async () => {
    const body = await intervalsFor([
      '2000;Movie 1;Studio;Alexandra Andrews, Producer B and Producer C;yes',
      '2003;Movie 2;Studio;Producer B;yes',
      '2005;Movie 3;Studio;Producer C, and Alexandra Andrews;yes',
    ]);

    expect(body).toStrictEqual({
      min: [{ producer: 'Producer B', interval: 3, previousWin: 2000, followingWin: 2003 }],
      max: [
        { producer: 'Alexandra Andrews', interval: 5, previousWin: 2000, followingWin: 2005 },
        { producer: 'Producer C', interval: 5, previousWin: 2000, followingWin: 2005 },
      ],
    });
  });

  it('accepts the winner flag regardless of case and surrounding spaces', async () => {
    const body = await intervalsFor([
      '2000;Movie 1;Studio;Producer 1; YES ',
      '2004;Movie 2;Studio;Producer 1;Yes',
    ]);

    const expected = [{ producer: 'Producer 1', interval: 4, previousWin: 2000, followingWin: 2004 }];
    expect(body).toStrictEqual({ min: expected, max: expected });
  });

  it('counts two awards won in the same year as an interval of zero', async () => {
    const body = await intervalsFor([
      '2000;Movie 1;Studio;Producer 1;yes',
      '2000;Movie 2;Studio;Producer 1;yes',
      '2010;Movie 3;Studio;Producer 2;yes',
      '2020;Movie 4;Studio;Producer 2;yes',
    ]);

    expect(body).toStrictEqual({
      min: [{ producer: 'Producer 1', interval: 0, previousWin: 2000, followingWin: 2000 }],
      max: [{ producer: 'Producer 2', interval: 10, previousWin: 2010, followingWin: 2020 }],
    });
  });

  it('returns empty lists when no producer has won more than once', async () => {
    const body = await intervalsFor([
      '2000;Movie 1;Studio;Producer 1;yes',
      '2001;Movie 2;Studio;Producer 2;yes',
      '2002;Movie 3;Studio;Producer 1;',
    ]);

    expect(body).toStrictEqual({ min: [], max: [] });
  });

  it('returns empty lists for a CSV with only the header', async () => {
    expect(await intervalsFor([])).toStrictEqual({ min: [], max: [] });
  });
});
