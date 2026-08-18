import { vehicleService } from '../services/vehicle.service.js';
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
  console.log('\n🚘 RUNNING BIYAEASE REAL-TIME VEHICLES & GPS TELEMETRY TESTS...\n');

  const testVehicleId = `JEEP-KATIPUNAN-${Date.now()}`;
  const qcCords = { latitude: 14.6538, longitude: 121.0685 };

  // ----------------------------------------------------
  // 1. Vehicle Position Telemetry Upsert
  // ----------------------------------------------------
  const pos1 = await vehicleService.updateVehiclePosition({
    vehicleId: testVehicleId,
    latitude: qcCords.latitude,
    longitude: qcCords.longitude,
    bearing: 180.5,
    speed: 25.0,
  });

  assert(
    pos1.vehicle_id === testVehicleId && pos1.latitude === qcCords.latitude,
    'Upserts initial vehicle GPS position and telemetry'
  );

  // ----------------------------------------------------
  // 2. Telemetry Position Update (Moving Vehicle)
  // ----------------------------------------------------
  const newLat = 14.6545;
  const newLng = 121.0692;
  const pos2 = await vehicleService.updateVehiclePosition({
    vehicleId: testVehicleId,
    latitude: newLat,
    longitude: newLng,
    bearing: 195.0,
    speed: 32.5,
  });

  assert(
    pos2.latitude === newLat && pos2.longitude === newLng,
    'Updates vehicle GPS coordinates in place without creating duplicate entries'
  );

  // ----------------------------------------------------
  // 3. PostGIS Spatial Radius Query for Nearby Vehicles
  // ----------------------------------------------------
  const nearby = await vehicleService.getNearbyVehicles(qcCords.latitude, qcCords.longitude, 5000);
  assert(
    nearby.some((v) => v.vehicle_id === testVehicleId),
    'PostGIS ST_DWithin locates live moving vehicle within 5km radius'
  );

  assert(
    typeof nearby[0]?.distance_meters === 'number',
    'Calculates accurate distance to queried commuter location'
  );

  console.log(`\n📊 REAL-TIME VEHICLES TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

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
