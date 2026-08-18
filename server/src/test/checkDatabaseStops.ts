import { getDatabasePool } from '../database/index.js';

async function main() {
  const pool = getDatabasePool();
  if (!pool) {
    console.error('No database pool');
    process.exit(1);
  }
  const client = await pool.connect();
  try {
    const stopsRes = await client.query('SELECT COUNT(*) FROM stops;');
    const routesRes = await client.query('SELECT COUNT(*) FROM routes;');
    const tripsRes = await client.query('SELECT COUNT(*) FROM trips;');
    const stopTimesRes = await client.query('SELECT COUNT(*) FROM stop_times;');

    console.log('--- DATABASE RECORD COUNTS ---');
    console.log('Stops count:', stopsRes.rows[0].count);
    console.log('Routes count:', routesRes.rows[0].count);
    console.log('Trips count:', tripsRes.rows[0].count);
    console.log('Stop Times count:', stopTimesRes.rows[0].count);

    const sampleStops = await client.query(
      'SELECT id, external_id, name, latitude, longitude FROM stops LIMIT 5;'
    );
    console.log('\n--- SAMPLE STOPS ---');
    console.table(sampleStops.rows);

    const metroManilaStops = await client.query(`
      SELECT id, name, latitude, longitude,
             ST_Distance(location, ST_SetSRID(ST_MakePoint(121.0685, 14.6538), 4326)::geography) as distance_meters
      FROM stops
      WHERE location IS NOT NULL
      ORDER BY distance_meters ASC
      LIMIT 10;
    `);
    console.log('\n--- 10 CLOSEST STOPS TO UP DILIMAN ---');
    console.table(metroManilaStops.rows);

  } finally {
    client.release();
    process.exit(0);
  }
}

main();
