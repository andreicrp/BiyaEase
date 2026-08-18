import { getDatabasePool } from '../database/index.js';

async function main() {
  const pool = getDatabasePool();
  if (!pool) {
    console.error('No pool');
    process.exit(1);
  }
  const client = await pool.connect();
  try {
    const dbRes = await client.query('SELECT current_database(), current_schema();');
    console.log('Current Connection Target:', dbRes.rows[0]);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\n--- TABLES IN CURRENT DATABASE ---');
    console.table(tablesRes.rows);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
