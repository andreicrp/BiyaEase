import { localSavedPlacesRepository } from '../repositories/savedPlacesRepository';
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
  console.log('\n📍 RUNNING BIYAEASE SAVED PLACES & LOCAL PERSISTENCE TESTS...\n');

  // Reset storage before test run
  await localStorageService.clearMemoryStore();

  // ----------------------------------------------------
  // 1. Saved Place Creation & Validation
  // ----------------------------------------------------
  const val1 = await localSavedPlacesRepository.save({
    id: 'sp-1',
    name: '',
    latitude: 14.6538,
    longitude: 121.0685,
    category: 'favorite',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(!val1.success, 'Rejects saved place with empty name');

  const val2 = await localSavedPlacesRepository.save({
    id: 'sp-2',
    name: 'UP Diliman',
    latitude: 120, // Invalid latitude > 90
    longitude: 121.0685,
    category: 'school',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(!val2.success, 'Rejects saved place with invalid latitude (>90)');

  const valid1 = await localSavedPlacesRepository.save({
    id: 'sp-upd',
    name: 'UP Diliman',
    subtitle: 'Quezon City',
    latitude: 14.6538,
    longitude: 121.0685,
    category: 'school',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(valid1.success && !!valid1.place, 'Saves valid location successfully');

  // ----------------------------------------------------
  // 2. Saved Place Deduplication
  // ----------------------------------------------------
  const dup1 = await localSavedPlacesRepository.save({
    id: 'sp-upd-dup',
    name: '  UP Diliman ', // Same normalized name
    latitude: 14.6539, // Within 15m distance
    longitude: 121.0686,
    category: 'favorite',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(
    dup1.success && dup1.place?.id === 'sp-upd',
    'Deduplicates saved place with same normalized name and <30m distance'
  );

  // ----------------------------------------------------
  // 3. Home & Work Category Uniqueness
  // ----------------------------------------------------
  const home1 = await localSavedPlacesRepository.save({
    id: 'sp-home-1',
    name: 'My Condo',
    latitude: 14.65,
    longitude: 121.06,
    category: 'home',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(home1.success, 'Saves first Home location');

  const home2Attempt = await localSavedPlacesRepository.save({
    id: 'sp-home-2',
    name: 'My Apartment',
    latitude: 14.6,
    longitude: 121.0,
    category: 'home',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(
    !home2Attempt.success && home2Attempt.requiresReplace === 'home',
    'Triggers replacement confirmation prompt for 2nd Home entry'
  );

  const home2Force = await localSavedPlacesRepository.save(
    {
      id: 'sp-home-2',
      name: 'My Apartment',
      latitude: 14.6,
      longitude: 121.0,
      category: 'home',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    { forceReplaceCategory: true }
  );
  assert(home2Force.success, 'Force replaces category for new Home location');

  const allPlacesAfterHomeReplace = await localSavedPlacesRepository.getAll();
  const homeEntries = allPlacesAfterHomeReplace.filter((p) => p.category === 'home');
  assert(
    homeEntries.length === 1 && homeEntries[0]?.id === 'sp-home-2',
    'Enforces strict single Home category entry'
  );

  // ----------------------------------------------------
  // 4. Edit, Rename & Category Changes
  // ----------------------------------------------------
  const updateRes = await localSavedPlacesRepository.update({
    id: 'sp-home-2',
    name: 'My New Apartment',
    subtitle: 'Makati City',
    latitude: 14.6,
    longitude: 121.0,
    category: 'home',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  assert(updateRes.success, 'Updates saved place details successfully');

  const updatedPlace = await localSavedPlacesRepository.getById('sp-home-2');
  assert(updatedPlace?.name === 'My New Apartment', 'Persists updated name cleanly');

  // ----------------------------------------------------
  // 5. Deletion & Persistence
  // ----------------------------------------------------
  await localSavedPlacesRepository.delete('sp-upd');
  const afterDelete = await localSavedPlacesRepository.getById('sp-upd');
  assert(afterDelete === null, 'Deletes saved place cleanly from storage');

  // ----------------------------------------------------
  // 6. Corrupted Storage Resilience
  // ----------------------------------------------------
  await localStorageService.setItem('biyaease.savedPlaces.v1', '{ corrupted_json: true');
  const corruptedFallback = await localSavedPlacesRepository.getAll();
  assert(
    Array.isArray(corruptedFallback),
    'Safely recovers from corrupted storage JSON without crashing'
  );

  console.log(`\n📊 SAVED PLACES TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
