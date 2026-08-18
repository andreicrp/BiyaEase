import { authService } from '../services/auth.service.js';
import { savedDataService } from '../services/savedData.service.js';
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
  console.log('\n🔐 RUNNING BIYAEASE AUTHENTICATION & CLOUD SYNC TESTS...\n');

  const testEmail = `test.commuter.${Date.now()}@biyaease.ph`;
  const testPassword = 'Password123!';
  const testName = 'Juan Dela Cruz';

  // ----------------------------------------------------
  // 1. User Registration
  // ----------------------------------------------------
  const reg1 = await authService.register('', testPassword, testName).catch((e) => e.message);
  assert(reg1 === 'Please provide a valid email address', 'Rejects empty email address');

  const reg2 = await authService.register(testEmail, '123', testName).catch((e) => e.message);
  assert(
    reg2 === 'Password must be at least 6 characters long',
    'Rejects password shorter than 6 characters'
  );

  const regResult = await authService.register(testEmail, testPassword, testName);
  assert(
    !!regResult.user.id &&
      regResult.user.email === testEmail &&
      regResult.user.displayName === testName,
    'Registers valid user successfully'
  );
  assert(!!regResult.token, 'Generates valid JWT access token upon registration');

  // ----------------------------------------------------
  // 2. Duplicate Email Prevention
  // ----------------------------------------------------
  const dupErr = await authService
    .register(testEmail, testPassword, 'Another Name')
    .catch((e) => e.message);
  assert(
    dupErr === 'An account with this email address already exists',
    'Prevents duplicate registration with existing email'
  );

  // ----------------------------------------------------
  // 3. User Login & Password Validation
  // ----------------------------------------------------
  const invalidPassErr = await authService
    .login(testEmail, 'WrongPassword!')
    .catch((e) => e.message);
  assert(
    invalidPassErr === 'Invalid email address or password',
    'Rejects login with invalid password'
  );

  const loginResult = await authService.login(testEmail, testPassword);
  assert(
    loginResult.user.email === testEmail && !!loginResult.token,
    'Authenticates valid user login successfully'
  );

  // ----------------------------------------------------
  // 4. JWT Token Verification & User Profile Retrieval
  // ----------------------------------------------------
  const decodedToken = authService.verifyToken(loginResult.token);
  assert(
    decodedToken?.sub === loginResult.user.id && decodedToken?.email === testEmail,
    'Verifies and decodes JWT token payload accurately'
  );

  const currentUser = await authService.getCurrentUser(loginResult.user.id);
  assert(
    currentUser?.id === loginResult.user.id && currentUser?.displayName === testName,
    'Retrieves user profile data cleanly'
  );

  // ----------------------------------------------------
  // 5. Saved Places & Favorite Routes Cloud Syncing
  // ----------------------------------------------------
  const syncPlaces = await savedDataService.syncLocalPlaces(loginResult.user.id, [
    {
      id: `sp-sync-home-${Date.now()}`,
      name: 'Synced Home',
      latitude: 14.6538,
      longitude: 121.0685,
      category: 'home',
      subtitle: 'Quezon City',
    },
  ]);
  assert(
    syncPlaces.some((p) => p.name === 'Synced Home'),
    'Syncs and merges local saved place to cloud PostgreSQL account'
  );

  const syncRoutes = await savedDataService.syncLocalRoutes(loginResult.user.id, [
    {
      id: `fr-sync-${Date.now()}`,
      displayName: 'Synced Daily Commute',
      origin: { id: 'orig', name: 'UP Diliman', latitude: 14.6538, longitude: 121.0685 },
      destination: { id: 'dest', name: 'SM North EDSA', latitude: 14.6565, longitude: 121.0288 },
      modeSummary: ['JEEPNEY', 'MRT'],
      estimatedDurationMinutes: 35,
      estimatedFare: 28,
    },
  ]);
  assert(
    syncRoutes.some((r) => r.display_name === 'Synced Daily Commute'),
    'Syncs and merges local favorite route template to cloud PostgreSQL account'
  );

  console.log(`\n📊 AUTHENTICATION & SYNC TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

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
