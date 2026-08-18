import { getDatabasePool, testDatabaseConnection, closeDatabasePool } from './index.js';
import { logger } from '../utils/logger.js';

export async function verifyAndEnablePostGIS(): Promise<boolean> {
  const connected = await testDatabaseConnection();
  if (!connected) {
    logger.warn('Cannot verify PostGIS: Database is not connected.');
    return false;
  }

  const pool = getDatabasePool();
  if (!pool) return false;

  try {
    const client = await pool.connect();
    try {
      logger.info('Checking/Enabling PostGIS extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      const versionResult = await client.query('SELECT PostGIS_Full_Version();');
      const version = versionResult.rows[0]?.postgis_full_version ?? 'PostGIS enabled';
      logger.info(`✅ PostGIS is active: ${version}`);
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Error verifying PostGIS: ${message}`);
    return false;
  }
}

// Allow direct execution via CLI
if (process.argv[1]?.endsWith('postgis.ts') || process.argv[1]?.endsWith('postgis.js')) {
  verifyAndEnablePostGIS()
    .then(async (success) => {
      await closeDatabasePool();
      process.exit(success ? 0 : 1);
    })
    .catch(async (err) => {
      logger.error('PostGIS verification script error:', err);
      await closeDatabasePool();
      process.exit(1);
    });
}
