import {
  geoJsonToCoordinate,
  geoJsonLineStringToCoordinates,
  calculateRegionForCoordinates,
  computeDistanceMeters,
  formatDistanceMeters,
  isValidCoordinate,
} from './geoUtils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

export function runGeoUnitTests(): boolean {
  console.log('\n🧪 RUNNING GEOSPATIAL & MAP UTILITY TESTS...\n');

  // Test 1: Single GeoJSON Coordinate Conversion ([lng, lat] -> { lat, lng })
  const coord = geoJsonToCoordinate([121.0685, 14.6538]);
  assert(
    coord.latitude === 14.6538 && coord.longitude === 121.0685,
    'Converts GeoJSON [lng, lat] to { latitude, longitude }'
  );

  // Test 2: GeoJSON LineString Coordinates Array Conversion
  const rawLineString: [number, number][] = [
    [121.0685, 14.6538],
    [121.0718, 14.6519],
    [121.0531, 14.6536],
  ];
  const lineCoords = geoJsonLineStringToCoordinates(rawLineString);
  assert(
    lineCoords.length === 3 &&
      lineCoords[0]?.latitude === 14.6538 &&
      lineCoords[2]?.longitude === 121.0531,
    'Converts multi-point GeoJSON LineString correctly'
  );

  // Test 3: Bounding Box & Region Calculation
  const region = calculateRegionForCoordinates(lineCoords);
  assert(
    region.latitude > 14.65 &&
      region.latitude < 14.66 &&
      region.longitude > 121.05 &&
      region.longitude < 121.08 &&
      region.latitudeDelta > 0 &&
      region.longitudeDelta > 0,
    'Calculates accurate bounding box and map region deltas'
  );

  // Test 4: Distance calculation & formatting
  const p1 = { latitude: 14.6538, longitude: 121.0685 }; // UP Oval
  const p2 = { latitude: 14.6519, longitude: 121.0718 }; // Vinzons Hall
  const dist = computeDistanceMeters(p1, p2);
  assert(dist > 350 && dist < 500, 'Haversine distance calculates ~413m between UP landmarks');
  assert(formatDistanceMeters(450) === '450 m', 'Formats distance under 1km in meters');
  assert(formatDistanceMeters(2300) === '2.3 km', 'Formats distance over 1km in kilometers');

  // Test 5: Coordinate validity checks
  assert(isValidCoordinate(14.6538, 121.0685), 'Identifies valid Metro Manila coordinates');
  assert(!isValidCoordinate(95.0, 121.0), 'Rejects latitude > 90');
  assert(!isValidCoordinate(14.0, 200.0), 'Rejects longitude > 180');
  assert(!isValidCoordinate(NaN, 121.0), 'Rejects NaN coordinate');

  console.log(`\n📊 GEO TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);
  return failed === 0;
}

if (
  process.argv[1]?.endsWith('geoTestRunner.ts') ||
  process.argv[1]?.endsWith('geoTestRunner.js')
) {
  const ok = runGeoUnitTests();
  process.exit(ok ? 0 : 1);
}
