import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApplication, type Application } from '../../src/application.js';

export const DEFAULT_CSV_PATH = path.resolve(import.meta.dirname, '../../data/movielist.csv');

const HEADER = 'year;title;studios;producers;winner';

/** Boots the whole application (CSV -> in-memory DB -> HTTP) from CSV content. */
export function createApplicationFromCsv(lines: string[], header = HEADER): Application {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'movielist-'));
  const file = path.join(dir, 'movielist.csv');
  fs.writeFileSync(file, [header, ...lines].join('\n'), 'utf8');
  try {
    return createApplication(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
