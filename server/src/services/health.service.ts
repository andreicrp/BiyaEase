import { HealthCheckResponse } from '../types/index.js';
import { getDatabasePool } from '../database/index.js';
import { env } from '../config/env.js';

export class HealthService {
  public static async getHealthStatus(): Promise<HealthCheckResponse> {
    if (!env.DATABASE_URL) {
      return {
        status: 'ok',
        service: 'biyaease-api',
        version: '0.1.0',
        database: 'unconfigured',
        timestamp: new Date().toISOString(),
      };
    }

    const pool = getDatabasePool();
    if (!pool) {
      return {
        status: 'degraded',
        service: 'biyaease-api',
        version: '0.1.0',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const client = await pool.connect();
      try {
        const postgisRes = await client.query('SELECT PostGIS_Version() AS version;');
        const postgisVersion = postgisRes.rows[0]?.version ?? 'enabled';

        return {
          status: 'ok',
          service: 'biyaease-api',
          version: '0.1.0',
          database: 'connected',
          postgis: postgisVersion,
          timestamp: new Date().toISOString(),
        };
      } finally {
        client.release();
      }
    } catch {
      return {
        status: 'degraded',
        service: 'biyaease-api',
        version: '0.1.0',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
