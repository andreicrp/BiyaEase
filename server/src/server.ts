import http from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { testDatabaseConnection, closeDatabasePool } from './database/index.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

async function startServer(): Promise<void> {
  logger.info(`Starting BiyaEase API in [${env.NODE_ENV}] mode...`);

  // Attempt database connection check
  if (env.DATABASE_URL) {
    logger.info('Verifying PostgreSQL connection...');
    await testDatabaseConnection();
  } else {
    logger.info('ℹ️ DATABASE_URL is not set. Running in decoupled/stateless mode.');
  }

  // Start listening on specified PORT
  server.listen(env.PORT, () => {
    logger.info(`🚀 BiyaEase API server is running on port ${env.PORT}`);
    logger.info(`   Health check: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeDatabasePool();
      process.exit(0);
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
      logger.error('Forceful shutdown triggered after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Fatal error during server startup:', error);
  process.exit(1);
});
