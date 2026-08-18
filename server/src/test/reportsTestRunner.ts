import { reportsService } from '../services/reports.service.js';
import { authService } from '../services/auth.service.js';
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
  console.log('\n📢 RUNNING BIYAEASE COMMUNITY CROWD REPORTS & POSTGIS SPATIAL TESTS...\n');

  // Create test user for report authoring
  const authorEmail = `author.${Date.now()}@biyaease.ph`;
  const user1 = await authService.register(authorEmail, 'Password123!', 'Reporter Juan');
  const user2 = await authService.register(
    `second.${Date.now()}@biyaease.ph`,
    'Password123!',
    'Commuter Maria'
  );

  const qcCords = { latitude: 14.6538, longitude: 121.0685 }; // UP Diliman / Katipunan
  const davaoCords = { latitude: 7.1907, longitude: 125.4553 }; // Davao City (~980km away)

  // ----------------------------------------------------
  // 1. Input Validation Tests
  // ----------------------------------------------------
  const invalidTypeErr = await reportsService
    .createReport(user1.user.id, {
      type: 'invalid_type' as any,
      latitude: qcCords.latitude,
      longitude: qcCords.longitude,
      title: 'Invalid',
    })
    .catch((e) => e.message);
  assert(
    invalidTypeErr.includes('Invalid report category type'),
    'Rejects report submission with invalid category type'
  );

  const emptyTitleErr = await reportsService
    .createReport(user1.user.id, {
      type: 'traffic',
      latitude: qcCords.latitude,
      longitude: qcCords.longitude,
      title: '   ',
    })
    .catch((e) => e.message);
  assert(
    emptyTitleErr === 'Report title is required',
    'Rejects report submission with empty title'
  );

  // ----------------------------------------------------
  // 2. Report Creation
  // ----------------------------------------------------
  const report1 = await reportsService.createReport(user1.user.id, {
    type: 'traffic',
    latitude: qcCords.latitude,
    longitude: qcCords.longitude,
    title: 'Heavy Traffic along Katipunan Ave',
    description: 'Roadwork reducing lanes near UPTC',
    expirationHours: 2,
  });

  assert(
    !!report1.id && report1.type === 'traffic' && report1.confirmed_count === 1,
    'Creates live community crowd report with initial 1 confirmation'
  );

  // ----------------------------------------------------
  // 3. PostGIS Spatial Radius Query (ST_DWithin)
  // ----------------------------------------------------
  const nearbyQC = await reportsService.getNearbyReports(qcCords.latitude, qcCords.longitude, 5000);
  assert(
    nearbyQC.some((r) => r.id === report1.id),
    'PostGIS ST_DWithin locates active crowd report within 5km radius'
  );
  assert(
    typeof nearbyQC[0]?.distance_meters === 'number',
    'Calculates accurate ST_Distance in meters to query origin'
  );

  // Spatial exclusion check
  const davaoReports = await reportsService.getNearbyReports(
    davaoCords.latitude,
    davaoCords.longitude,
    5000
  );
  assert(
    !davaoReports.some((r) => r.id === report1.id),
    'PostGIS spatial query cleanly excludes distant reports (~980km away)'
  );

  // ----------------------------------------------------
  // 4. Report Confirmation & Duplicate Prevention
  // ----------------------------------------------------
  const confirmRes = await reportsService.confirmReport(report1.id, user2.user.id);
  assert(
    confirmRes.success && confirmRes.confirmedCount === 2,
    'Increments confirmation count when second commuter confirms report'
  );

  const dupConfirmErr = await reportsService
    .confirmReport(report1.id, user2.user.id)
    .catch((e) => e.message);
  assert(
    dupConfirmErr === 'You have already confirmed this report',
    'Prevents duplicate confirmations by same user (SQL unique constraint)'
  );

  // ----------------------------------------------------
  // 5. Report Deletion & Ownership
  // ----------------------------------------------------
  const deleteSuccess = await reportsService.deleteReport(report1.id, user1.user.id);
  assert(deleteSuccess, 'Deletes report cleanly from PostGIS database');

  const afterDelete = await reportsService.getNearbyReports(
    qcCords.latitude,
    qcCords.longitude,
    5000
  );
  assert(
    !afterDelete.some((r) => r.id === report1.id),
    'Deleted report is no longer returned in nearby spatial queries'
  );

  console.log(`\n📊 COMMUNITY CROWD REPORTS TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

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
