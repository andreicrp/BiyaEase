import { getDatabasePool, closeDatabasePool } from './index.js';
import { runMigrations } from './migrate.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function resetDatabase(forceProductionReset: boolean = false): Promise<boolean> {
  const pool = getDatabasePool();
  if (!pool) {
    logger.error('❌ Cannot reset database: Database pool is not available. Check DATABASE_URL.');
    return false;
  }

  // Safety guard against accidental production database drops
  const isProductionEnv = env.NODE_ENV === 'production';
  const isRemoteHost =
    env.DATABASE_URL &&
    !env.DATABASE_URL.includes('localhost') &&
    !env.DATABASE_URL.includes('127.0.0.1');

  if ((isProductionEnv || isRemoteHost) && !forceProductionReset) {
    logger.error(
      '🚨 PRODUCTION SAFETY GUARD: Refusing to drop database in production/remote environment.'
    );
    logger.error(
      '   If you explicitly intend to reset a remote database, pass `--force-production-reset`.'
    );
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
      DROP TABLE IF EXISTS transit_datasets CASCADE;
      DROP TABLE IF EXISTS transit_sources CASCADE;
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
  const force = process.argv.includes('--force-production-reset');
  resetDatabase(force)
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
