import { routingService } from '../services/routing.service.js';
import { gtfsTimeToSeconds, calculateTimeDifferenceSeconds } from '../routing/timeCalculator.js';
import { calculateSegmentFare } from '../routing/fareCalculator.js';
import { closeDatabasePool } from '../database/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 RUNNING BIYAEASE MULTI-MODAL ROUTING ENGINE TESTS...\n');

  try {
    // 1. GTFS Time Handling Tests (supports overnight >24h)
    assert(gtfsTimeToSeconds('05:30:00') === 19800, 'GTFS 05:30:00 converts to 19,800 seconds');
    assert(
      gtfsTimeToSeconds('25:30:00') === 91800,
      'GTFS overnight 25:30:00 converts to 91,800 seconds'
    );
    assert(
      calculateTimeDifferenceSeconds('05:30:00', '05:45:00') === 900,
      'Time difference 05:30 -> 05:45 is 900s (15 min)'
    );

    // 2. Fare Calculation Tests
    const jeepFare = calculateSegmentFare('jeepney', 3000);
    assert(jeepFare === 13, 'Jeepney fare for 3km is base ₱13');
    const longJeepFare = calculateSegmentFare('jeepney', 8000, {
      routeId: 'r1',
      modeId: 'jeepney',
      baseFare: 13,
      minimumFare: 13,
      perKmRate: 1.8,
      currency: 'PHP',
    });
    assert(longJeepFare === 20, 'Jeepney fare for 8km calculates ₱13 + 4*₱1.80 = ₱20');

    // 3. Walking-Only Direct Route Test (Short Distance ~300m)
    const walkingResult = await routingService.planJourney({
      origin: { latitude: 14.6538, longitude: 121.0685, name: 'UP Oval' },
      destination: { latitude: 14.6519, longitude: 121.0718, name: 'UP Vinzons' },
      maxWalkingDistanceMeters: 1000,
    });
    assert(walkingResult.length >= 1, 'Short trip generates feasible route option');
    assert(
      walkingResult.some((j) => j.modes.includes('walking') && j.fare === 0),
      'Short trip includes free walking option'
    );

    // 4. Real Database Single-Transit Jeepney Journey (UP Diliman -> Philcoa)
    const jeepResult = await routingService.planJourney({
      origin: { latitude: 14.6538, longitude: 121.0685, name: 'UP Diliman' },
      destination: { latitude: 14.6536, longitude: 121.0531, name: 'Philcoa PUV Terminal' },
      maxWalkingDistanceMeters: 1000,
    });
    assert(jeepResult.length >= 1, 'Discovers route from UP Diliman to Philcoa');
    const jeepJourney = jeepResult.find((j) => j.modes.includes('jeepney'));
    assert(jeepJourney !== undefined, 'Route includes Jeepney transit segment');
    if (jeepJourney) {
      assert(jeepJourney.fare >= 13, `Jeepney fare is ₱${jeepJourney.fare} (>= ₱13)`);
      assert(
        jeepJourney.segments.some((s) => s.type === 'transit' && s.routeCode === 'JEEP-05'),
        'Uses JEEP-05 corridor'
      );
    }

    // 5. Real Database MRT-3 Train Journey (North Ave -> Cubao)
    const mrtResult = await routingService.planJourney({
      origin: { latitude: 14.6532, longitude: 121.0322, name: 'North Ave MRT' },
      destination: { latitude: 14.6196, longitude: 121.0511, name: 'Cubao MRT' },
      maxWalkingDistanceMeters: 1000,
    });
    assert(mrtResult.length >= 1, 'Discovers MRT route along EDSA from North Ave to Cubao');
    const mrtJourney = mrtResult.find((j) => j.modes.includes('mrt'));
    assert(mrtJourney !== undefined, 'Route includes MRT transit segment');

    // 6. Multi-Criteria Ranking & Deduplication Test
    assert(
      mrtResult[0]?.label !== undefined || mrtResult[0]?.isRecommended === true,
      'Best route is ranked and labeled'
    );

    // 7. Distant Unconnected / No Route Scenario (e.g. Remote location with 0 stops)
    const noRouteResult = await routingService.planJourney({
      origin: { latitude: 13.0, longitude: 120.0, name: 'Remote Island' },
      destination: { latitude: 14.0, longitude: 122.0, name: 'Remote Mountain' },
      maxWalkingDistanceMeters: 500,
    });
    assert(
      Array.isArray(noRouteResult) && noRouteResult.length === 0,
      'Gracefully returns empty array when no route exists'
    );
  } catch (error) {
    console.error('❌ Test execution error:', error);
    failed++;
  } finally {
    await closeDatabasePool();
    console.log(`\n📊 ROUTING TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);
    process.exit(failed === 0 ? 0 : 1);
  }
}

runTests();
