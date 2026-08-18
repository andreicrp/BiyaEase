import { getDatabasePool, closeDatabasePool } from './index.js';
import { runMigrations } from './migrate.js';
import { logger } from '../utils/logger.js';

export async function resetDatabase(): Promise<boolean> {
  const pool = getDatabasePool();
  if (!pool) {
    logger.error('❌ Cannot reset database: Database pool is not available.');
    return false;
  }

  const client = await pool.connect();
  try {
    logger.warn('[RESET] Dropping all transit tables and schema_migrations...');
    await client.query(`
      DROP TABLE IF EXISTS stop_times CASCADE;
      DROP TABLE IF EXISTS trips CASCADE;
      DROP TABLE IF EXISTS shapes CASCADE;
      DROP TABLE IF EXISTS route_variants CASCADE;
      DROP TABLE IF EXISTS fares CASCADE;
      DROP TABLE IF EXISTS routes CASCADE;
      DROP TABLE IF EXISTS stops CASCADE;
      DROP TABLE IF EXISTS places CASCADE;
      DROP TABLE IF EXISTS services CASCADE;
      DROP TABLE IF EXISTS transit_modes CASCADE;
      DROP TABLE IF EXISTS agencies CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
    `);
    logger.info('[RESET] ✅ All tables dropped successfully.');

    return await runMigrations();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Reset failed: ${msg}`);
    return false;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('reset.ts') || process.argv[1]?.endsWith('reset.js')) {
  resetDatabase()
    .then(async (success) => {
      await closeDatabasePool();
      process.exit(success ? 0 : 1);
    })
    .catch(async (err) => {
      logger.error('Reset error:', err);
      await closeDatabasePool();
      process.exit(1);
    });
}
