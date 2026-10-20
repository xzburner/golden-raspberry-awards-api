import type { DatabaseConnection } from '../database/connection.js';

export interface Movie {
  id: number;
  year: number;
  title: string;
  studios: string[];
  producers: string[];
  winner: boolean;
}

export interface MovieFilter {
  year?: number;
  winner?: boolean;
}

interface MovieRow {
  id: number;
  year: number;
  title: string;
  winner: number;
  studios: string;
  producers: string;
}

// Names are aggregated as JSON arrays so names containing commas are preserved.
const SELECT_MOVIES = `
  SELECT m.id, m.year, m.title, m.winner,
         COALESCE((SELECT json_group_array(s.name)
                     FROM movie_studios ms JOIN studios s ON s.id = ms.studio_id
                    WHERE ms.movie_id = m.id), '[]') AS studios,
         COALESCE((SELECT json_group_array(p.name)
                     FROM movie_producers mp JOIN producers p ON p.id = mp.producer_id
                    WHERE mp.movie_id = m.id), '[]') AS producers
    FROM movies m
`;

export class MovieRepository {
  private readonly findByIdStatement;
  private readonly findAllStatement;

  constructor(db: DatabaseConnection) {
    this.findByIdStatement = db.prepare(`${SELECT_MOVIES} WHERE m.id = ?`);
    this.findAllStatement = db.prepare(`
      ${SELECT_MOVIES}
       WHERE (@year IS NULL OR m.year = @year)
         AND (@winner IS NULL OR m.winner = @winner)
       ORDER BY m.year, m.id
    `);
  }

  findById(id: number): Movie | undefined {
    const row = this.findByIdStatement.get(id) as MovieRow | undefined;
    return row ? toMovie(row) : undefined;
  }

  findAll(filter: MovieFilter = {}): Movie[] {
    const rows = this.findAllStatement.all({
      year: filter.year ?? null,
      winner: filter.winner === undefined ? null : Number(filter.winner),
    }) as unknown as MovieRow[];
    return rows.map(toMovie);
  }
}

function toMovie(row: MovieRow): Movie {
  return {
    id: row.id,
    year: row.year,
    title: row.title,
    studios: JSON.parse(row.studios) as string[],
    producers: JSON.parse(row.producers) as string[],
    winner: row.winner === 1,
  };
}
