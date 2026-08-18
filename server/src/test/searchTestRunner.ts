import { searchService } from '../services/search.service.js';
import { closeDatabasePool } from '../database/index.js';

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

export async function runSearchTests(): Promise<boolean> {
  console.log('\n🧪 RUNNING LOCATION SEARCH & AUTOCOMPLETE TESTS...\n');

  try {
    // Test 1: Exact Place Match
    const exactResults = await searchService.search({ queryText: 'UP Diliman' });
    assert(
      exactResults.length > 0 && exactResults[0]?.name.includes('UP Diliman'),
      'Exact search for "UP Diliman" returns UP Diliman as #1 result'
    );

    // Test 2: Prefix Matching
    const prefixResults = await searchService.search({ queryText: 'SM' });
    assert(
      prefixResults.length > 0 && prefixResults.some((r) => r.name.includes('SM')),
      'Prefix search for "SM" finds SM malls'
    );

    // Test 3: Train Station Discovery
    const mrtResults = await searchService.search({ queryText: 'MRT' });
    assert(
      mrtResults.length > 0 && mrtResults.some((r) => r.type === 'station' || r.mode === 'mrt'),
      'Searching "MRT" discovers MRT stations'
    );

    // Test 4: Route Discovery
    const routeResults = await searchService.search({ queryText: 'Route 05' });
    assert(
      routeResults.length > 0 && routeResults.some((r) => r.type === 'route'),
      'Searching "Route 05" finds matching transit route corridor'
    );

    // Test 5: Mixed Multi-Entity Ranking ("UP" should return both UP Diliman place and UP jeepney stop/route)
    const mixedResults = await searchService.search({ queryText: 'UP' });
    assert(
      mixedResults.length >= 2 &&
        mixedResults.some((r) => r.type === 'place') &&
        (mixedResults.some((r) => r.type === 'stop') ||
          mixedResults.some((r) => r.type === 'route')),
      'Multi-entity search for "UP" returns ranked places, stops, and routes'
    );

    // Test 6: PostGIS Proximity Ranking (UP coordinates: 14.6538, 121.0685)
    const nearbyResults = await searchService.search({
      queryText: 'Station',
      lat: 14.6425,
      lng: 121.0384,
      radiusMeters: 5000,
    });
    assert(
      nearbyResults.length > 0 &&
        nearbyResults.every((r) => r.distanceMeters !== undefined && r.distanceMeters <= 5000),
      'Spatial search calculates accurate PostGIS distance_meters within 5km radius'
    );

    // Test 7: Result Limits
    const limitedResults = await searchService.search({ queryText: 'a', limit: 3 });
    assert(limitedResults.length <= 3, 'Respects limit parameter constraint');

    // Test 8: Empty Query Handling
    const emptyResults = await searchService.search({ queryText: '   ' });
    assert(emptyResults.length === 0, 'Empty query gracefully returns empty array');

    console.log(`\n📊 SEARCH TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);
    return failed === 0;
  } catch (err) {
    console.error('Search test runner error:', err);
    return false;
  } finally {
    await closeDatabasePool();
  }
}

if (
  process.argv[1]?.endsWith('searchTestRunner.ts') ||
  process.argv[1]?.endsWith('searchTestRunner.js')
) {
  runSearchTests().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
