import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { parseNameList } from './name-list-parser.js';

export interface MovieRecord {
  year: number;
  title: string;
  studios: string[];
  producers: string[];
  winner: boolean;
}

const REQUIRED_COLUMNS = ['year', 'title', 'studios', 'producers', 'winner'] as const;
type Column = (typeof REQUIRED_COLUMNS)[number];
type RawRow = Record<Column, string | undefined>;

export class CsvFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvFormatError';
  }
}

/** Reads the movie list CSV (semicolon separated, with header) into typed records. */
export function readMovieCsv(filePath: string): MovieRecord[] {
  if (!fs.existsSync(filePath)) {
    throw new CsvFormatError(`CSV file not found: ${filePath}`);
  }
  return parseMovieCsv(fs.readFileSync(filePath, 'utf8'));
}

export function parseMovieCsv(content: string): MovieRecord[] {
  const rows: RawRow[] = parse(content, {
    delimiter: ';',
    bom: true,
    columns: (header: string[]) => header.map((column) => column.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (rows.length > 0) {
    const missing = REQUIRED_COLUMNS.filter((column) => !(column in rows[0]!));
    if (missing.length > 0) {
      throw new CsvFormatError(`CSV is missing required column(s): ${missing.join(', ')}`);
    }
  }

  // Header is line 1, so the first data row is line 2.
  return rows.map((row, index) => toMovieRecord(row, index + 2));
}

function toMovieRecord(row: RawRow, line: number): MovieRecord {
  const year = Number(row.year);
  if (!row.year || !Number.isInteger(year)) {
    throw new CsvFormatError(`Invalid year "${row.year ?? ''}" at line ${line}`);
  }

  const title = row.title?.trim();
  if (!title) {
    throw new CsvFormatError(`Missing title at line ${line}`);
  }

  return {
    year,
    title,
    studios: parseNameList(row.studios),
    producers: parseNameList(row.producers),
    winner: row.winner?.trim().toLowerCase() === 'yes',
  };
}
