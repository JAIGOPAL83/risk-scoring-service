import { buildServer } from './api/server.js';
import { loadConfig } from './infra/config.js';
import { createDatabase } from './infra/db.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase({ connectionString: config.DATABASE_URL, max: config.DB_POOL_MAX });
  const server = await buildServer({ db, logLevel: config.LOG_LEVEL });

  // Graceful shutdown: ECS and Kubernetes send SIGTERM on every deploy.
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.log.info({ signal }, 'shutting down');
    try {
      await server.close(); // stops accepting, drains in-flight requests
      await db.close();
      process.exit(0);
    } catch (err) {
      server.log.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await server.listen({ port: config.PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
