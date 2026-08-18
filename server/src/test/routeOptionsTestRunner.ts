import { rankAndLabelJourneys } from '../routing/routeRanker.js';
import { Journey } from '../routing/graph.types.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` - ${details}` : ''}`);
    failed++;
  }
}

function createSampleJourney(
  id: string,
  durationMinutes: number,
  fare: number,
  walkingDistanceMeters: number,
  transfers: number,
  modes: ('walking' | 'jeepney' | 'bus' | 'mrt' | 'lrt')[] = ['jeepney'],
  routeCodes: string[] = ['JEEP-05']
): Journey {
  return {
    id,
    durationMinutes,
    fare,
    currency: 'PHP',
    walkingDistanceMeters,
    transfers,
    modes,
    routeCodes,
    summary: `Via ${routeCodes.join(' → ')}`,
    origin: { latitude: 14.6538, longitude: 121.0685, name: 'UP Diliman' },
    destination: { latitude: 14.6536, longitude: 121.0531, name: 'Philcoa' },
    segments: [
      {
        type: 'transit',
        mode: modes[0] || 'jeepney',
        routeCode: routeCodes[0],
        durationMinutes,
        distanceMeters: 2000,
        fare,
        instructions: `Ride ${routeCodes[0]}`,
      },
    ],
  };
}

async function runRouteOptionsTests() {
  console.log('\n🧪 RUNNING ROUTE OPTIONS & ADVANCED JOURNEY COMPARISON TESTS...\n');

  const j1 = createSampleJourney('j-fastest', 25, 30, 400, 1, ['mrt'], ['MRT-3']);
  const j2 = createSampleJourney('j-cheapest', 45, 13, 500, 0, ['jeepney'], ['JEEP-05']);
  const j3 = createSampleJourney('j-least-walk', 35, 25, 150, 2, ['bus'], ['BUS-EDSA']);
  const j4 = createSampleJourney('j-fewest-xfers', 30, 20, 300, 0, ['bus'], ['BUS-CITY']);
  const j5 = createSampleJourney(
    'j-alt-1',
    40,
    22,
    600,
    1,
    ['jeepney', 'bus'],
    ['JEEP-05', 'BUS-EDSA']
  );
  const j6 = createSampleJourney('j-alt-2', 50, 25, 700, 2, ['jeepney'], ['JEEP-02']);

  const pool = [j1, j2, j3, j4, j5, j6];

  // 1. Multiple route alternatives
  const ranked = rankAndLabelJourneys(pool, 5);
  assert(ranked.length === 5, 'Enforces default 5 routes maximum from candidate pool');

  // 2. Deterministic Fastest ranking
  const fastest = ranked.find((j) => j.recommendations?.includes('fastest'));
  assert(
    fastest !== undefined && fastest.id === 'j-fastest' && fastest.durationMinutes === 25,
    'Fastest route is correctly identified based on lowest duration (25 min)'
  );

  // 3. Deterministic Cheapest ranking
  const cheapest = ranked.find((j) => j.recommendations?.includes('cheapest'));
  assert(
    cheapest !== undefined && cheapest.id === 'j-cheapest' && cheapest.fare === 13,
    'Cheapest route is correctly identified based on lowest fare (₱13)'
  );

  // 4. Deterministic Least Walking ranking
  const leastWalk = ranked.find((j) => j.recommendations?.includes('least_walking'));
  assert(
    leastWalk !== undefined &&
      leastWalk.id === 'j-least-walk' &&
      leastWalk.walkingDistanceMeters === 150,
    'Least walking route is correctly identified based on lowest walking distance (150m)'
  );

  // 5. Deterministic Fewest Transfers ranking
  const fewestTransfers = ranked.find((j) => j.recommendations?.includes('fewest_transfers'));
  assert(
    fewestTransfers !== undefined && fewestTransfers.transfers === 0,
    'Fewest transfers route correctly prioritizes 0 transfers'
  );

  // 6. Multi-label recommendation assignment
  // Construct a single route that is both fastest AND cheapest
  const perfectRoute = createSampleJourney('j-perfect', 15, 10, 100, 0, ['jeepney'], ['JEEP-05']);
  const multiLabelPool = [
    perfectRoute,
    createSampleJourney('j-slow-expensive', 60, 40, 800, 2, ['bus'], ['BUS-1']),
  ];
  const multiLabelRanked = rankAndLabelJourneys(multiLabelPool);
  const bestMulti = multiLabelRanked[0]!;
  assert(
    Boolean(
      bestMulti.recommendations?.includes('fastest') &&
      bestMulti.recommendations?.includes('cheapest') &&
      bestMulti.recommendations?.includes('least_walking') &&
      bestMulti.recommendations?.includes('fewest_transfers')
    ),
    'Assigns multiple recommendation badges (fastest, cheapest, least_walking) when a single route qualifies'
  );

  // 7. Deterministic tie-breaking
  // Two routes with same duration (30m): one has 0 transfers, the other has 1 transfer
  const tie1 = createSampleJourney('j-tie-0xfer', 30, 20, 400, 0, ['bus'], ['BUS-A']);
  const tie2 = createSampleJourney('j-tie-1xfer', 30, 20, 400, 1, ['jeepney'], ['JEEP-B']);
  const tieRanked = rankAndLabelJourneys([tie2, tie1]);
  assert(
    tieRanked[0]!.id === 'j-tie-0xfer',
    'Deterministic tie-breaking prioritizes fewer transfers when duration is identical'
  );

  // 8. Route limit constraint
  const manyPool = Array.from({ length: 15 }, (_, i) =>
    createSampleJourney(`j-${i}`, 20 + i, 15 + i, 200 + i * 50, i % 2)
  );
  const bounded5 = rankAndLabelJourneys(manyPool, 5);
  const bounded10 = rankAndLabelJourneys(manyPool, 10);
  const boundedMax = rankAndLabelJourneys(manyPool, 25);
  assert(
    bounded5.length === 5 && bounded10.length === 10 && boundedMax.length === 10,
    'Limits returned journeys strictly between 1 and 10'
  );

  // 9. Route codes extraction
  assert(
    Boolean(
      j5.routeCodes &&
      j5.routeCodes.length === 2 &&
      j5.routeCodes[0] === 'JEEP-05' &&
      j5.routeCodes[1] === 'BUS-EDSA'
    ),
    'Extracts route codes correctly for multi-segment journeys'
  );

  // 10. Empty route handling
  const emptyRanked = rankAndLabelJourneys([]);
  assert(
    Array.isArray(emptyRanked) && emptyRanked.length === 0,
    'Gracefully handles empty journeys array'
  );

  console.log(`\n📊 ROUTE OPTIONS TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRouteOptionsTests().catch((err) => {
  console.error('Route options test error:', err);
  process.exit(1);
});
