import { authService } from '../services/auth.service.js';
import { adminService } from '../services/admin.service.js';
import { reportsService } from '../services/reports.service.js';
import { closeDatabasePool, getDatabasePool } from '../database/index.js';

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
  console.log('\n👑 RUNNING BIYAEASE ADMIN DASHBOARD & MODERATION TESTS...\n');

  const pool = getDatabasePool();
  if (!pool) throw new Error('Database pool unavailable');

  // Create standard commuter user & admin user
  const regularUser = await authService.register(
    `commuter.${Date.now()}@biyaease.ph`,
    'Password123!',
    'Juan Dela Cruz'
  );
  const adminUser = await authService.register(
    `admin.${Date.now()}@biyaease.ph`,
    'Password123!',
    'System Admin Maria'
  );

  // Grant admin flag to adminUser
  await pool.query('UPDATE users SET is_admin = TRUE WHERE id = $1;', [adminUser.user.id]);

  // ----------------------------------------------------
  // 1. Admin Status Verification
  // ----------------------------------------------------
  const checkAdminRes = await pool.query<{ is_admin: boolean }>(
    'SELECT is_admin FROM users WHERE id = $1;',
    [adminUser.user.id]
  );
  assert(checkAdminRes.rows[0]?.is_admin === true, 'Sets and verifies admin flag on user account');

  const checkRegularRes = await pool.query<{ is_admin: boolean }>(
    'SELECT is_admin FROM users WHERE id = $1;',
    [regularUser.user.id]
  );
  assert(checkRegularRes.rows[0]?.is_admin === false, 'Standard user retains false admin flag by default');

  // ----------------------------------------------------
  // 2. Metrics Aggregation
  // ----------------------------------------------------
  const metrics = await adminService.getMetrics();
  assert(
    typeof metrics.totalUsers === 'number' && metrics.totalUsers >= 2,
    'Aggregates total registered users count'
  );
  assert(
    typeof metrics.totalGtfsStops === 'number' &&
      typeof metrics.totalGtfsRoutes === 'number' &&
      metrics.totalGtfsStops >= 0 &&
      metrics.totalGtfsRoutes >= 0,
    'Aggregates GTFS stops and routes metrics'
  );

  // ----------------------------------------------------
  // 3. Report Moderation Actions
  // ----------------------------------------------------
  const testReport = await reportsService.createReport(regularUser.user.id, {
    type: 'crowding',
    latitude: 14.6538,
    longitude: 121.0685,
    title: 'Station Overcrowded for Admin Test',
    expirationHours: 2,
  });

  const allReports = await adminService.getAllReports('all');
  assert(
    allReports.some((r) => r.id === testReport.id),
    'Admin retrieves community reports directory'
  );

  const dismissSuccess = await adminService.moderateReport(testReport.id, 'dismiss');
  assert(dismissSuccess, 'Admin dismisses active community report');

  const afterDismiss = await adminService.getAllReports('dismissed');
  assert(
    afterDismiss.some((r) => r.id === testReport.id && r.status === 'dismissed'),
    'Report status updates to dismissed in database'
  );

  const deleteSuccess = await adminService.moderateReport(testReport.id, 'delete');
  assert(deleteSuccess, 'Admin deletes moderated report from database');

  // ----------------------------------------------------
  // 4. User Directory Inspection
  // ----------------------------------------------------
  const usersList = await adminService.getAllUsers();
  assert(
    usersList.some((u) => u.id === regularUser.user.id) &&
      usersList.some((u) => u.id === adminUser.user.id && u.isAdmin),
    'Admin retrieves user directory with role indicators'
  );

  console.log(`\n📊 ADMIN DASHBOARD & MODERATION TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

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
