import { localFavoriteRoutesRepository } from '../repositories/favoriteRoutesRepository';
import { localStorageService } from '../services/localStorageService';

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
  console.log('\n⭐ RUNNING BIYAEASE FAVORITE ROUTES & LAUNCH PAYLOAD TESTS...\n');

  // Reset storage before test run
  await localStorageService.clearMemoryStore();

  // ----------------------------------------------------
  // 1. Favorite Route Validation
  // ----------------------------------------------------
  const val1 = await localFavoriteRoutesRepository.save({
    id: 'fr-1',
    name: '',
    origin: { id: 'orig', name: 'UP Diliman', latitude: 14.6538, longitude: 121.0685 },
    destination: { id: 'dest', name: 'SM North EDSA', latitude: 14.6565, longitude: 121.0288 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(!val1.success, 'Rejects favorite route with empty name');

  const val2 = await localFavoriteRoutesRepository.save({
    id: 'fr-2',
    name: 'Daily Commute',
    origin: { id: 'orig', name: 'UP Diliman', latitude: 120, longitude: 121.0685 }, // invalid lat
    destination: { id: 'dest', name: 'SM North EDSA', latitude: 14.6565, longitude: 121.0288 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(!val2.success, 'Rejects favorite route with invalid origin latitude');

  const valid1 = await localFavoriteRoutesRepository.save({
    id: 'fr-up-smnorth',
    name: 'Home to SM North',
    origin: { id: 'orig-up', name: 'UP Diliman', latitude: 14.6538, longitude: 121.0685 },
    destination: { id: 'dest-smnorth', name: 'SM North EDSA', latitude: 14.6565, longitude: 121.0288 },
    modeSummary: ['JEEPNEY', 'MRT'],
    routeSummary: 'UP Diliman ➔ SM North EDSA via North Ave',
    estimatedDurationMinutes: 35,
    estimatedFare: 28,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(valid1.success && !!valid1.route, 'Saves valid favorite route template successfully');

  // ----------------------------------------------------
  // 2. Favorite Route Deduplication
  // ----------------------------------------------------
  const dup1 = await localFavoriteRoutesRepository.save({
    id: 'fr-up-smnorth-dup',
    name: 'Different Name Same Path',
    origin: { id: 'orig-up', name: 'UP Diliman Campus', latitude: 14.6539, longitude: 121.0686 }, // within 20m
    destination: { id: 'dest-smnorth', name: 'SM North Mall', latitude: 14.6566, longitude: 121.0289 }, // within 20m
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(
    dup1.success && dup1.route?.id === 'fr-up-smnorth',
    'Deduplicates favorite route with same origin & destination coordinates (<30m threshold)'
  );

  // ----------------------------------------------------
  // 3. Route Launch Payload Reconstruction
  // ----------------------------------------------------
  const savedRoute = await localFavoriteRoutesRepository.getById('fr-up-smnorth');
  assert(!!savedRoute, 'Retrieves stored favorite route by ID');
  assert(
    savedRoute?.origin.latitude === 14.6538 && savedRoute?.destination.latitude === 14.6565,
    'Reconstructs exact origin & destination coordinate payload for Phase 6 routing search'
  );

  // ----------------------------------------------------
  // 4. Route Rename & Delete
  // ----------------------------------------------------
  const renameRes = await localFavoriteRoutesRepository.update({
    ...savedRoute!,
    name: 'Work Commute Express',
  });
  assert(renameRes.success, 'Renames favorite route successfully');

  const renamedRoute = await localFavoriteRoutesRepository.getById('fr-up-smnorth');
  assert(renamedRoute?.name === 'Work Commute Express', 'Persists renamed route title cleanly');

  await localFavoriteRoutesRepository.delete('fr-up-smnorth');
  const afterDelete = await localFavoriteRoutesRepository.getById('fr-up-smnorth');
  assert(afterDelete === null, 'Deletes favorite route cleanly from storage');

  console.log(`\n📊 FAVORITE ROUTES TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
