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
}
