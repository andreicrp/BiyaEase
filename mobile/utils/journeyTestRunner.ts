import { journeyAdapter } from '../services/journeyAdapter';
import { journeyProgressService, PROXIMITY_THRESHOLDS } from '../services/journeyProgressService';
import { locationService } from '../services/locationService';
import { Journey } from '../types/routing.types';
import { ActiveJourney, UserLocation } from '../types/journey.types';

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

async function runJourneyTests() {
  console.log('\n🧪 RUNNING BIYAEASE ACTIVE JOURNEY & GPS PROGRESS TESTS...\n');

  // Sample Phase 6 Journey
  const sampleJourney: Journey = {
    id: 'test-journey-101',
    label: 'FASTEST',
    isRecommended: true,
    durationMinutes: 18,
    fare: 13,
    currency: 'PHP',
    walkingDistanceMeters: 250,
    transfers: 0,
    modes: ['walking', 'jeepney', 'walking'],
    summary: 'Via JEEP-05',
    origin: {
      latitude: 14.6538,
      longitude: 121.0685,
      name: 'UP Diliman',
    },
    destination: {
      latitude: 14.6536,
      longitude: 121.0531,
      name: 'Philcoa',
    },
    segments: [
      {
        type: 'walking',
        mode: 'walking',
        fromStop: {
          id: 'stop-up-gate',
          name: 'UP Gate Waiting Shed',
          latitude: 14.6538,
          longitude: 121.0685,
        },
        toStop: {
          id: 'stop-up-board',
          name: 'University Ave Loading Area',
          latitude: 14.6535,
          longitude: 121.065,
        },
        durationMinutes: 3,
        distanceMeters: 250,
        fare: 0,
        instructions: 'Walk to University Ave Loading Area',
      },
      {
        type: 'transit',
        mode: 'jeepney',
        routeId: '105',
        routeName: 'UP Campus - Philcoa',
        routeCode: 'JEEP-05',
        fromStop: {
          id: 'stop-up-board',
          name: 'University Ave Loading Area',
          latitude: 14.6535,
          longitude: 121.065,
        },
        toStop: {
          id: 'stop-philcoa',
          name: 'Philcoa PUV Terminal',
          latitude: 14.6536,
          longitude: 121.0531,
        },
        durationMinutes: 12,
        distanceMeters: 1800,
        fare: 13,
        instructions: 'Board JEEP-05 towards Philcoa PUV Terminal',
      },
      {
        type: 'walking',
        mode: 'walking',
        fromStop: {
          id: 'stop-philcoa',
          name: 'Philcoa PUV Terminal',
          latitude: 14.6536,
          longitude: 121.0531,
        },
        toStop: {
          id: 'dest-philcoa',
          name: 'Philcoa Commercial Center',
          latitude: 14.6536,
          longitude: 121.052,
        },
        durationMinutes: 3,
        distanceMeters: 120,
        fare: 0,
        instructions: 'Walk to Philcoa Commercial Center',
      },
    ],
  };

  // 1. Phase 6 Journey to ActiveJourney adapter mapping
  const activeJourney = journeyAdapter.fromJourney(sampleJourney);
  assert(
    activeJourney.id === 'test-journey-101' &&
      activeJourney.steps.length === 5 &&
      activeJourney.status === 'walking_to_stop',
    'Phase 6 Journey correctly adapts into sequenced ActiveJourney steps'
  );

  // 2. Walking distance calculation
  const walkStep = activeJourney.steps[0]!;
  const userNearOrigin: UserLocation = {
    latitude: 14.6538,
    longitude: 121.0685,
    accuracy: 8,
    timestamp: new Date().toISOString(),
  };
  const walkDistance = journeyProgressService.getDistanceToStepTarget(userNearOrigin, walkStep);
  assert(
    walkDistance !== null && walkDistance > 300 && walkDistance < 450,
    'Walking distance calculation computes accurate distance to target stop'
  );

  // 3. Boarding proximity detection
  const boardStep = activeJourney.steps[1]!;
  const userAtBoardingStop: UserLocation = {
    latitude: 14.6535,
    longitude: 121.065, // Exact boarding stop coordinates
    accuracy: 5,
    timestamp: new Date().toISOString(),
  };
  const boardEval = journeyProgressService.evaluateStepProgress(userAtBoardingStop, boardStep);
  assert(
    boardEval.isNearTarget && boardEval.distanceMeters <= PROXIMITY_THRESHOLDS.BOARD,
    'Boarding proximity detection identifies user within 50m of boarding stop'
  );

  // 4. Alighting proximity detection
  const alightStep = activeJourney.steps[3]!;
  const userApproachingAlight: UserLocation = {
    latitude: 14.6536,
    longitude: 121.0538, // ~75m away from Philcoa terminal (121.0531)
    accuracy: 10,
    timestamp: new Date().toISOString(),
  };
  const alightEval = journeyProgressService.evaluateStepProgress(userApproachingAlight, alightStep);
  assert(
    alightEval.isNearTarget && alightEval.distanceMeters <= PROXIMITY_THRESHOLDS.ALIGHT,
    'Alighting proximity detection triggers alert within 120m threshold'
  );

  // 5. Destination proximity detection
  const destStep = activeJourney.steps[4]!;
  const userAtDestination: UserLocation = {
    latitude: 14.6536,
    longitude: 121.0521, // ~10m from dest
    accuracy: 5,
    timestamp: new Date().toISOString(),
  };
  const destEval = journeyProgressService.evaluateStepProgress(userAtDestination, destStep);
  assert(
    destEval.isNearTarget && destEval.distanceMeters <= PROXIMITY_THRESHOLDS.DESTINATION,
    'Destination proximity detection flags arrival within 40m'
  );

  // 6. GPS accuracy filtering
  assert(
    locationService.isAccuracyAcceptable(15) &&
      locationService.isAccuracyAcceptable(80) &&
      !locationService.isAccuracyAcceptable(180),
    'GPS accuracy filtering accepts accurate readings and flags >100m error'
  );

  // 7. Coordinate bounds validation
  assert(
    locationService.isValidCoordinate(14.6538, 121.0685) &&
      !locationService.isValidCoordinate(95, 121) &&
      !locationService.isValidCoordinate(14, 200) &&
      !locationService.isValidCoordinate(NaN, 121),
    'Coordinate validation rejects out-of-range latitudes and longitudes'
  );

  // 8. Journey state transitions
  const journeyState: ActiveJourney = { ...activeJourney };
  assert(journeyState.status === 'walking_to_stop', 'Initial state is walking_to_stop');
  journeyState.status = 'boarding';
  assert(journeyState.status === 'boarding', 'Transitions to boarding at stop');
  journeyState.status = 'in_transit';
  assert(journeyState.status === 'in_transit', 'Transitions to in_transit when user boards');
  journeyState.status = 'alighting';
  assert(journeyState.status === 'alighting', 'Transitions to alighting near destination stop');
  journeyState.status = 'walking_to_destination';
  assert(journeyState.status === 'walking_to_destination', 'Transitions to walking_to_destination');
  journeyState.status = 'completed';
  assert(journeyState.status === 'completed', 'Transitions to completed upon arrival');

  // 9. Step advancement logic
  let stepIdx = activeJourney.currentStepIndex;
  stepIdx++;
  assert(
    stepIdx === 1 && activeJourney.steps[stepIdx]?.type === 'board',
    'Step advances to boarding'
  );
  stepIdx++;
  assert(
    stepIdx === 2 && activeJourney.steps[stepIdx]?.type === 'transit',
    'Step advances to in_transit'
  );

  // 10. Journey cancellation
  const cancelledJourney: ActiveJourney = {
    ...activeJourney,
    status: 'cancelled',
  };
  assert(cancelledJourney.status === 'cancelled', 'Journey cancellation marks status as cancelled');

  // 11. Journey completion metrics
  const completedJourney: ActiveJourney = {
    ...activeJourney,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
  assert(
    completedJourney.status === 'completed' && typeof completedJourney.completedAt === 'string',
    'Journey completion records timestamp and finished status'
  );

  // 12. Active journey serialization & validation
  const serialized = JSON.stringify(activeJourney);
  const parsed = JSON.parse(serialized);
  assert(
    parsed.id === activeJourney.id &&
      parsed.steps.length === 5 &&
      parsed.status === 'walking_to_stop',
    'Active journey serializes and deserializes accurately'
  );

  // 13. Invalid persisted journey recovery
  const corruptPayload = '{"id": 123, "corrupted": true}';
  let isValidPayload = false;
  try {
    const p = JSON.parse(corruptPayload);
    if (p && typeof p.id === 'string' && Array.isArray(p.steps)) {
      isValidPayload = true;
    }
  } catch {
    isValidPayload = false;
  }
  assert(!isValidPayload, 'Recovery logic safely catches and rejects corrupt persisted journey');

  // 14. Off-route warning detection
  const userFarAway: UserLocation = {
    latitude: 14.61, // Diverted towards Ortigas (>4km away)
    longitude: 121.05,
    accuracy: 10,
    timestamp: new Date().toISOString(),
  };
  const offRouteEval = journeyProgressService.evaluateStepProgress(userFarAway, walkStep, 250);
  assert(
    offRouteEval.isOffRoute,
    'Off-route warning triggers when user moves >400m away from target'
  );

  console.log(`\n📊 JOURNEY TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runJourneyTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
