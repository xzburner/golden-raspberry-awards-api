import { createApplication } from './application.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const application = createApplication(config.csvFilePath);

const server = application.app.listen(config.port, () => {
  console.log(`Data loaded from ${config.csvFilePath}`);
  console.log(`Server listening on http://localhost:${config.port}`);
});

function shutdown(): void {
  server.close(() => {
    application.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
