import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let pool: Pool | null = null;

export function getDatabasePool(): Pool | null {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl:
        env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false,
            }
          : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client pool', err.message);
    });
  }

  return pool;
}

export async function testDatabaseConnection(): Promise<boolean> {
  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL is not set. Database connection skipped.');
    return false;
  }

  const dbPool = getDatabasePool();
  if (!dbPool) {
    return false;
  }

  try {
    const client = await dbPool.connect();
    try {
      const res = await client.query('SELECT NOW() AS now, current_database() AS db_name');
      const dbName = res.rows[0]?.db_name ?? 'unknown';
      logger.info(`✅ Successfully connected to PostgreSQL database [${dbName}]`);
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Failed to connect to PostgreSQL database: ${message}`);
    return false;
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const dbPool = getDatabasePool();
  if (!dbPool) {
    throw new Error('Database pool not initialized. Check DATABASE_URL.');
  }
  return dbPool.query<T>(text, params);
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL connection pool closed');
  }
}
