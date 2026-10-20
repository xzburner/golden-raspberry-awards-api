import type { DatabaseConnection } from '../database/connection.js';

export interface ProducerAwardInterval {
  producer: string;
  interval: number;
  previousWin: number;
  followingWin: number;
}

export interface ProducerAwardIntervalExtremes {
  min: ProducerAwardInterval[];
  max: ProducerAwardInterval[];
}

/**
 * For every producer, pairs each award with the producer's previous award (LAG over the
 * producer's winning years) and keeps only the pairs whose interval equals the global
 * minimum or maximum. Ties are all returned.
 *
 * A producer credited on two winning movies in the same year produces an interval of 0,
 * since those are two consecutive awards.
 */
const AWARD_INTERVAL_EXTREMES_SQL = `
  WITH wins AS (
    SELECT p.name AS producer, m.year AS year
      FROM movies m
      JOIN movie_producers mp ON mp.movie_id = m.id
      JOIN producers p        ON p.id = mp.producer_id
     WHERE m.winner = 1
  ),
  consecutive_wins AS (
    SELECT producer,
           LAG(year) OVER (PARTITION BY producer ORDER BY year) AS previousWin,
           year                                                 AS followingWin
      FROM wins
  ),
  intervals AS (
    SELECT producer, followingWin - previousWin AS interval, previousWin, followingWin
      FROM consecutive_wins
     WHERE previousWin IS NOT NULL
  ),
  bounds AS (
    SELECT MIN(interval) AS min_interval, MAX(interval) AS max_interval FROM intervals
  )
  SELECT 'min' AS kind, i.* FROM intervals i, bounds b WHERE i.interval = b.min_interval
  UNION ALL
  SELECT 'max' AS kind, i.* FROM intervals i, bounds b WHERE i.interval = b.max_interval
  ORDER BY kind, producer, previousWin
`;

type IntervalRow = ProducerAwardInterval & { kind: 'min' | 'max' };

export class ProducerRepository {
  private readonly awardIntervalExtremes;

  constructor(db: DatabaseConnection) {
    this.awardIntervalExtremes = db.prepare(AWARD_INTERVAL_EXTREMES_SQL);
  }

  findAwardIntervalExtremes(): ProducerAwardIntervalExtremes {
    const result: ProducerAwardIntervalExtremes = { min: [], max: [] };
    for (const { kind, ...interval } of this.awardIntervalExtremes.all() as unknown as IntervalRow[]) {
      result[kind].push(interval);
    }
    return result;
  }
}
