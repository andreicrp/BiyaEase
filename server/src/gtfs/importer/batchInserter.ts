import { PoolClient } from 'pg';

export class BatchInserter {
  /**
   * Performs batched parameterized INSERT query into PostgreSQL table
   */
  public static async insertBatch<T extends Record<string, unknown>>(
    client: PoolClient,
    tableName: string,
    columns: string[],
    rows: T[],
    batchSize: number = 500
  ): Promise<number> {
    if (rows.length === 0) return 0;

    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const valueParams: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      for (const row of chunk) {
        const rowPlaceholders: string[] = [];
        for (const col of columns) {
          rowPlaceholders.push(`$${paramIndex++}`);
          values.push(row[col] !== undefined ? row[col] : null);
        }
        valueParams.push(`(${rowPlaceholders.join(', ')})`);
      }

      const sql = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES ${valueParams.join(', ')}
        ON CONFLICT DO NOTHING;
      `;

      const res = await client.query(sql, values);
      insertedCount += res.rowCount ?? 0;
    }

    return insertedCount;
  }

  /**
   * Fast batched insert for stops with spatial geography calculation
   */
  public static async insertStopsBatch(
    client: PoolClient,
    stops: Array<{
      id: string;
      source_id: string;
      dataset_id: string;
      external_id: string;
      code: string | null;
      name: string;
      description: string | null;
      latitude: number;
      longitude: number;
    }>,
    batchSize: number = 500
  ): Promise<number> {
    if (stops.length === 0) return 0;
    let insertedCount = 0;

    for (let i = 0; i < stops.length; i += batchSize) {
      const chunk = stops.slice(i, i + batchSize);
      const valueParams: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      for (const s of chunk) {
        valueParams.push(
          `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, ST_SetSRID(ST_MakePoint($${idx + 8}, $${idx + 7}), 4326)::geography, true, 'gtfs')`
        );
        values.push(
          s.id,
          s.source_id,
          s.dataset_id,
          s.external_id,
          s.code,
          s.name,
          s.description,
          s.latitude,
          s.longitude
        );
        idx += 9;
      }

      const sql = `
        INSERT INTO stops (id, source_id, dataset_id, external_id, code, name, description, latitude, longitude, location, is_active, source)
        VALUES ${valueParams.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          location = EXCLUDED.location;
      `;

      const res = await client.query(sql, values);
      insertedCount += res.rowCount ?? 0;
    }

    return insertedCount;
  }
}
