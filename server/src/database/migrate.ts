import fs from 'fs';
import path from 'path';
import { getDatabasePool, closeDatabasePool } from './index.js';
import { logger } from '../utils/logger.js';

export async function runMigrations(): Promise<boolean> {
  const pool = getDatabasePool();
  if (!pool) {
    logger.error('❌ Cannot run migrations: Database pool is not available. Check DATABASE_URL.');
    return false;
  }

  const client = await pool.connect();
  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch applied migrations
    const appliedResult = await client.query<{ name: string }>(
      'SELECT name FROM schema_migrations ORDER BY id ASC;'
    );
    const appliedMigrations = new Set(appliedResult.rows.map((row) => row.name));

    // 3. Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      logger.warn(`Migrations directory not found: ${migrationsDir}`);
      return true;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        continue;
      }

      logger.info(`[MIGRATE] Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute migration in transaction
      await client.query('BEGIN;');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT;');
        logger.info(`[MIGRATE] ✅ Applied: ${file}`);
        appliedCount++;
      } catch (migrationError) {
        await client.query('ROLLBACK;');
        const msg = migrationError instanceof Error ? migrationError.message : 'Unknown error';
        logger.error(`[MIGRATE] ❌ Failed to apply migration ${file}: ${msg}`);
        throw migrationError;
      }
    }

    if (appliedCount === 0) {
      logger.info('✨ Database schema is up to date. No pending migrations.');
    } else {
      logger.info(`🎉 Successfully applied ${appliedCount} migration(s).`);
    }

    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Migration process failed: ${msg}`);
    return false;
  } finally {
    client.release();
  }
}

// Direct CLI execution
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(async (success) => {
      await closeDatabasePool();
      process.exit(success ? 0 : 1);
    })
    .catch(async (err) => {
      logger.error('Migration runner error:', err);
      await closeDatabasePool();
      process.exit(1);
    });
}
