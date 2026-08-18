import { navigationMatcher } from '../navigation/navigationMatcher';
import { nextStopTracker } from '../navigation/nextStopTracker';
import { offRouteDetector } from '../navigation/offRouteDetector';
import { alertService } from '../services/alertService';
import { navigationEngine } from '../navigation/navigationEngine';
import { JourneyStep, UserLocation } from '../types/journey.types';
import { Coordinates } from './geoUtils';

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

console.log('\n🧭 RUNNING BIYAEASE LIVE NAVIGATION & REAL-TIME ALERTS TESTS...\n');

// ----------------------------------------------------
// 1. Navigation Matcher Tests
// ----------------------------------------------------
const routePolyline: Coordinates[] = [
  { latitude: 14.6538, longitude: 121.0685 }, // UP Diliman
  { latitude: 14.6525, longitude: 121.0600 }, // Midpoint
  { latitude: 14.6536, longitude: 121.0531 }, // Philcoa
];

const nearOriginLoc: Coordinates = { latitude: 14.6539, longitude: 121.0684 };
const match1 = navigationMatcher.matchLocationToPolyline(nearOriginLoc, routePolyline);
assert(match1.isNearRoute, 'Identifies location close to route corridor as near route');
assert(match1.progressPercent <= 15, 'Computes low progress % near beginning of route');
assert(match1.remainingDistanceMeters > 1000, 'Calculates >1000m remaining distance at start');

const nearPhilcoaLoc: Coordinates = { latitude: 14.6536, longitude: 121.0532 };
const match2 = navigationMatcher.matchLocationToPolyline(nearPhilcoaLoc, routePolyline);
assert(match2.progressPercent >= 90, 'Computes >90% progress near destination of route');
assert(match2.remainingDistanceMeters <= 50, 'Calculates <=50m remaining distance near end');

const farOffLoc: Coordinates = { latitude: 14.7000, longitude: 121.1000 };
const match3 = navigationMatcher.matchLocationToPolyline(farOffLoc, routePolyline, 250);
assert(!match3.isNearRoute, 'Flags location far from route corridor as not near route');
assert(match3.distanceFromRouteMeters > 500, 'Calculates >500m cross-track distance for off-route coordinate');

// ----------------------------------------------------
// 2. Next Stop Tracker Tests
// ----------------------------------------------------
const transitStep: JourneyStep = {
  id: 'step-transit-1',
  type: 'transit',
  mode: 'jeepney',
  title: 'Ride JEEP-05',
  fromStopName: 'UP Diliman Academic Oval',
  toStopName: 'Philcoa PUV Hub',
  routeCode: 'JEEP-05',
  latitude: 14.6536,
  longitude: 121.0531,
  stopsCount: 4,
  distanceMeters: 1800,
  completed: false,
};

const userInTransitEarly: UserLocation = {
  latitude: 14.6530,
  longitude: 121.0640,
  timestamp: new Date().toISOString(),
};
const stopInfo1 = nextStopTracker.trackNextStop(userInTransitEarly, transitStep);
assert(stopInfo1.stopsRemaining >= 2, 'In-transit tracker estimates remaining stops along route');
assert(!stopInfo1.isApproachingAlight, 'Does not flag approaching alight when far from alight stop');

const userNearAlight: UserLocation = {
  latitude: 14.6536,
  longitude: 121.0540,
  timestamp: new Date().toISOString(),
};
const stopInfo2 = nextStopTracker.trackNextStop(userNearAlight, transitStep);
assert(stopInfo2.isApproachingAlight, 'Triggers isApproachingAlight when within 150m threshold');
assert(stopInfo2.stopsRemaining === 1, 'Sets stopsRemaining to 1 when approaching alight');

// ----------------------------------------------------
// 3. Off-Route & Wrong-Direction Detection Tests
// ----------------------------------------------------
offRouteDetector.reset();
const targetStop: Coordinates = { latitude: 14.6538, longitude: 121.0685 };

// Single reading off corridor should NOT trigger off-route immediately (3-strike rule)
const reading1 = offRouteDetector.evaluateLocation(
  { latitude: 14.6600, longitude: 121.0800, timestamp: '' },
  targetStop,
  450
);
assert(!reading1.isOffRoute, '1st off-corridor reading does not immediately trigger off-route (3-strike rule)');
assert(reading1.consecutiveOffRouteReadings === 1, 'Increments consecutive off-route counter to 1');

// 2nd reading off corridor
offRouteDetector.evaluateLocation(
  { latitude: 14.6610, longitude: 121.0810, timestamp: '' },
  targetStop,
  460
);
// 3rd reading off corridor triggers off-route
const reading3 = offRouteDetector.evaluateLocation(
  { latitude: 14.6620, longitude: 121.0820, timestamp: '' },
  targetStop,
  470
);
assert(reading3.isOffRoute, '3 consecutive off-corridor readings triggers off-route state');
assert(!!reading3.recoveryGuidance, 'Provides clear recovery guidance message');

// Auto-recovery when returning within 200m
const recoveryReading = offRouteDetector.evaluateLocation(
  { latitude: 14.6539, longitude: 121.0686, timestamp: '' },
  targetStop,
  150
);
assert(!recoveryReading.isOffRoute, 'Auto-recovers from off-route when user returns within 200m corridor');

// ----------------------------------------------------
// 4. Alert Service Deduplication Tests
// ----------------------------------------------------
alertService.reset();
const firstTrigger = alertService.triggerAlert(0, 'boarding', 'Approaching Stop', '120m away', 'jeepney');
assert(firstTrigger.isNew, 'First alert trigger marks isNew = true');

const duplicateTrigger = alertService.triggerAlert(0, 'boarding', 'Approaching Stop', '100m away', 'jeepney');
assert(!duplicateTrigger.isNew, 'Duplicate alert for same step and type is cleanly deduplicated');

const differentStepTrigger = alertService.triggerAlert(1, 'alighting', 'Get Ready to Alight', '120m away', 'jeepney');
assert(differentStepTrigger.isNew, 'Alert for different step triggers cleanly');
assert(alertService.getHistory().length === 2, 'Maintains exact chronological alert history');

// ----------------------------------------------------
// 5. Navigation Engine State Machine Integration Tests
// ----------------------------------------------------
navigationEngine.reset();
const walkToBoardStep: JourneyStep = {
  id: 'step-walk-1',
  type: 'board',
  mode: 'walking',
  title: 'Walk to UP Diliman Academic Oval',
  latitude: 14.6538,
  longitude: 121.0685,
  distanceMeters: 350,
  completed: false,
};

// User at 300m -> walking_to_board
const nav1 = navigationEngine.update({
  userLocation: { latitude: 14.6510, longitude: 121.0685, timestamp: '' },
  currentStep: walkToBoardStep,
  allSteps: [walkToBoardStep, transitStep],
  stepIndex: 0,
});
assert(nav1.status === 'walking_to_board', 'Initial distant walk state is walking_to_board');

// User moves to 90m -> approaching_board
const nav2 = navigationEngine.update({
  userLocation: { latitude: 14.6530, longitude: 121.0685, timestamp: '' },
  currentStep: walkToBoardStep,
  allSteps: [walkToBoardStep, transitStep],
  stepIndex: 0,
});
assert(nav2.status === 'approaching_board', 'Transitions to approaching_board within 120m threshold');

// User moves to 30m -> boarding
const nav3 = navigationEngine.update({
  userLocation: { latitude: 14.6537, longitude: 121.0685, timestamp: '' },
  currentStep: walkToBoardStep,
  allSteps: [walkToBoardStep, transitStep],
  stepIndex: 0,
});
assert(nav3.status === 'boarding', 'Transitions to boarding within 50m threshold');

// In-transit step testing
const nav4 = navigationEngine.update({
  userLocation: { latitude: 14.6530, longitude: 121.0600, timestamp: '' },
  currentStep: transitStep,
  allSteps: [walkToBoardStep, transitStep],
  stepIndex: 1,
});
assert(nav4.status === 'in_transit', 'In-transit step initiates with in_transit status');
assert(!!nav4.nextStopInfo, 'In-transit state populates nextStopInfo with stops countdown');

// Near destination step testing
const destStep: JourneyStep = {
  id: 'step-dest-1',
  type: 'destination',
  mode: 'walking',
  title: 'Destination: Philcoa',
  latitude: 14.6536,
  longitude: 121.0531,
  completed: false,
};

const nav5 = navigationEngine.update({
  userLocation: { latitude: 14.6536, longitude: 121.0532, timestamp: '' },
  currentStep: destStep,
  allSteps: [walkToBoardStep, transitStep, destStep],
  stepIndex: 2,
});
assert(nav5.status === 'arrived', 'Transitions to arrived status when within 40m of destination');

console.log(`\n📊 NAVIGATION TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

if (failed > 0) {
  process.exit(1);
}
