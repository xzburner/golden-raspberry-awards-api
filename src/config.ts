import path from 'node:path';

export interface AppConfig {
  port: number;
  csvFilePath: string;
}

const DEFAULT_PORT = 8080;
const DEFAULT_CSV_PATH = path.resolve(process.cwd(), 'data', 'movielist.csv');

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: "${env.PORT}"`);
  }

  return {
    port,
    csvFilePath: env.MOVIELIST_CSV_PATH ? path.resolve(env.MOVIELIST_CSV_PATH) : DEFAULT_CSV_PATH,
  };
}
