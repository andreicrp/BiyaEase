import { gtfsAdminService } from '../services/gtfsAdmin.service.js';
import { closeDatabasePool } from '../database/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🚍 RUNNING BIYAEASE GTFS TRANSIT DATA MANAGEMENT TESTS...\n');

  // ----------------------------------------------------
  // 1. Fetch GTFS Agencies, Routes, and Stops
  // ----------------------------------------------------
  const agencies = await gtfsAdminService.getAgencies();
  assert(Array.isArray(agencies), 'Retrieves GTFS agencies list');

  const routes = await gtfsAdminService.getRoutes();
  assert(Array.isArray(routes), 'Retrieves GTFS routes list with stop counts');

  const stops = await gtfsAdminService.getStops(50);
  assert(Array.isArray(stops), 'Retrieves GTFS stops list with coordinates');

  // ----------------------------------------------------
  // 2. Create/Update GTFS Route
  // ----------------------------------------------------
  const testRouteId = `route-test-${Date.now()}`;
  const newRoute = await gtfsAdminService.createOrUpdateRoute({
    id: testRouteId,
    agencyId: agencies[0]?.id || undefined,
    code: 'TEST-101',
    name: 'Katipunan - SM North Express',
    routeColor: '0284C7',
  });
  assert(
    newRoute.id === testRouteId && newRoute.code === 'TEST-101',
    'Creates new GTFS route entry'
  );

  // ----------------------------------------------------
  // 3. Create/Update GTFS Stop Location
  // ----------------------------------------------------
  const testStopId = `stop-test-${Date.now()}`;
  const newStop = await gtfsAdminService.createOrUpdateStop({
    id: testStopId,
    code: 'STOP-99',
    name: 'UP Town Center Gate 2',
    latitude: 14.6538,
    longitude: 121.0685,
  });
  assert(
    newStop.id === testStopId && newStop.name === 'UP Town Center Gate 2',
    'Creates new GTFS stop location entry'
  );

  // ----------------------------------------------------
  // 4. Cleanup Test Entries
  // ----------------------------------------------------
  const deleteRouteSuccess = await gtfsAdminService.deleteRoute(testRouteId);
  assert(deleteRouteSuccess, 'Deletes test GTFS route entry');

  const deleteStopSuccess = await gtfsAdminService.deleteStop(testStopId);
  assert(deleteStopSuccess, 'Deletes test GTFS stop location entry');

  console.log(`\n📊 GTFS TRANSIT MANAGEMENT TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

  await closeDatabasePool();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(async (err) => {
  console.error(err);
  await closeDatabasePool();
  process.exit(1);
});
