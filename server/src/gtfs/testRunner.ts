import path from 'path';
import { parseCsvLine, parseCsvString } from './parser/csvParser.js';
import { ModeMapper } from './normalizer/modeMapper.js';
import { validateStops } from './validators/stopValidator.js';
import { validateStopTimes } from './validators/stopTimeValidator.js';
import { validateShapes } from './validators/shapeValidator.js';
import { FeedValidator } from './validators/feedValidator.js';
import { logger } from '../utils/logger.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    logger.info(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    logger.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

export async function runGtfsUnitTests(): Promise<boolean> {
  logger.info('\n🧪 RUNNING GTFS UNIT & INTEGRATION TESTS...\n');

  // Test 1: CSV Line Tokenizer
  const csvLine =
    'AG-01,"Department of Transportation, Philippines",http://dotr.gov.ph,"Asia/Manila","""Quoted"""';
  const tokens = parseCsvLine(csvLine);
  assert(tokens.length === 5, 'CSV Parser splits correct number of fields');
  assert(
    tokens[1] === 'Department of Transportation, Philippines',
    'CSV Parser handles embedded commas'
  );
  assert(tokens[4] === '"Quoted"', 'CSV Parser unescapes double quotes');

  // Test 2: CSV String Parsing
  const csvText = 'id,name,val\n1,"Item 1",100\n2,"Item 2",200';
  const rows = parseCsvString<{ id: string; name: string; val: string }>(csvText);
  assert(rows.length === 2 && rows[0]?.name === 'Item 1', 'CSV String Parser extracts objects');

  // Test 3: ModeMapper
  const mapper = new ModeMapper({ mappings: { CUSTOM_JEEP: 'jeepney' } });
  assert(
    mapper.resolveMode('715', 'Route 05') === 'mode-jeepney',
    'ModeMapper resolves GTFS 715 to jeepney'
  );
  assert(mapper.resolveMode('1', 'MRT-3 Line') === 'mode-mrt', 'ModeMapper resolves GTFS 1 to MRT');
  assert(mapper.resolveMode('0', 'LRT-2 Line') === 'mode-lrt', 'ModeMapper resolves GTFS 0 to LRT');
  assert(mapper.resolveMode('3', 'City Bus') === 'mode-bus', 'ModeMapper resolves GTFS 3 to Bus');
  assert(
    mapper.resolveMode('CUSTOM_JEEP') === 'mode-jeepney',
    'ModeMapper resolves custom feed mappings'
  );

  // Test 4: Coordinate Validation
  const invalidStops = [
    { stop_id: 'S1', stop_name: 'Invalid Lat', stop_lat: '95.0', stop_lon: '121.0' },
    { stop_id: 'S2', stop_name: 'Invalid Lon', stop_lat: '14.0', stop_lon: '200.0' },
  ];
  const stopIssues = validateStops(invalidStops);
  assert(
    stopIssues.filter((i) => i.severity === 'ERROR').length === 2,
    'StopValidator flags out-of-range coordinates'
  );

  // Test 5: Stop Time Ordering
  const invalidStopTimes = [
    { trip_id: 'T1', stop_id: 'S1', stop_sequence: '0' }, // seq <= 0
    { trip_id: 'T1', stop_id: 'S2', stop_sequence: '1' },
    { trip_id: 'T1', stop_id: 'S3', stop_sequence: '1' }, // duplicate seq
  ];
  const stIssues = validateStopTimes(
    invalidStopTimes,
    new Set(['T1']),
    new Set(['S1', 'S2', 'S3'])
  );
  assert(
    stIssues.filter((i) => i.severity === 'ERROR').length === 2,
    'StopTimeValidator catches non-positive and duplicate sequences'
  );

  // Test 6: Shape LineString point density
  const invalidShapes = [
    { shape_id: 'SH1', shape_pt_lat: '14.5', shape_pt_lon: '121.0', shape_pt_sequence: '1' }, // Only 1 point
  ];
  const shapeIssues = validateShapes(invalidShapes);
  assert(
    shapeIssues.filter((i) => i.severity === 'ERROR').length >= 1,
    'ShapeValidator rejects single-point shapes'
  );

  // Test 7: Full Synthetic Philippines GTFS Fixture
  const fixtureDir = path.resolve(process.cwd(), 'data/raw/fixtures/sample-philippines');
  const { feed, validation } = await FeedValidator.loadAndValidateFeed(fixtureDir);
  assert(validation.isValid, 'Sample Philippines GTFS fixture passes validation with 0 errors');
  assert(feed !== null && feed.stops.length >= 8, 'Sample fixture loads all expected stops');
  assert(feed !== null && feed.routes.length >= 3, 'Sample fixture loads all expected routes');

  logger.info(`\n📊 TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);
  return failed === 0;
}

if (process.argv[1]?.endsWith('testRunner.ts') || process.argv[1]?.endsWith('testRunner.js')) {
  runGtfsUnitTests()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      logger.error('Test execution error:', err);
      process.exit(1);
    });
}
