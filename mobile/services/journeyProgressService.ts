import { calculateHaversineDistance } from '../utils/geoUtils';
import { ActiveJourney, JourneyStep, UserLocation } from '../types/journey.types';

export interface StepProgressResult {
  distanceMeters: number;
  isNearTarget: boolean;
  proximityThreshold: number;
  isOffRoute: boolean;
  message: string;
}

export const PROXIMITY_THRESHOLDS = {
  WALK: 40, // 40m to consider walking destination reached
  BOARD: 50, // 50m to announce arrival at boarding stop
  ALIGHT: 120, // 120m to alert commuter to prepare to alight
  DESTINATION: 40, // 40m for final arrival
  OFF_ROUTE_DISTANCE: 400, // 400m deviation threshold
};

export const journeyProgressService = {
  /**
   * Calculates distance between user and the current active step target coordinate
   */
  getDistanceToStepTarget(userLocation: UserLocation, step: JourneyStep): number | null {
    if (step.latitude === undefined || step.longitude === undefined) {
      return null;
    }

    return calculateHaversineDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: step.latitude, longitude: step.longitude }
    );
  },

  /**
   * Evaluates the commuter's progress towards the current step target
   */
  evaluateStepProgress(
    userLocation: UserLocation,
    step: JourneyStep,
    initialStepDistance?: number
  ): StepProgressResult {
    const dist = this.getDistanceToStepTarget(userLocation, step);

    if (dist === null) {
      return {
        distanceMeters: 0,
        isNearTarget: false,
        proximityThreshold: 0,
        isOffRoute: false,
        message: 'Navigating to next step',
      };
    }

    let threshold = PROXIMITY_THRESHOLDS.WALK;
    if (step.type === 'board') threshold = PROXIMITY_THRESHOLDS.BOARD;
    else if (step.type === 'alight') threshold = PROXIMITY_THRESHOLDS.ALIGHT;
    else if (step.type === 'destination') threshold = PROXIMITY_THRESHOLDS.DESTINATION;

    const isNear = dist <= threshold;

    // Check off-route warning (user is >400m away and significantly further than initial)
    const isOffRoute =
      initialStepDistance !== undefined &&
      initialStepDistance > 0 &&
      dist > initialStepDistance + PROXIMITY_THRESHOLDS.OFF_ROUTE_DISTANCE;

    let message = `${Math.round(dist)} m away`;
    if (isNear) {
      if (step.type === 'board')
        message = `You're near your boarding stop (${step.fromStopName || 'Stop'})`;
      else if (step.type === 'alight')
        message = `You're near ${step.toStopName || 'your stop'}. Prepare to alight!`;
      else if (step.type === 'destination') message = "You've arrived at your destination!";
      else message = 'Near target stop';
    } else if (isOffRoute) {
      message = 'You may be moving away from your target stop';
    }

    return {
      distanceMeters: Math.round(dist),
      isNearTarget: isNear,
      proximityThreshold: threshold,
      isOffRoute,
      message,
    };
  },

  /**
   * Determine total remaining distance and estimated minutes for active journey
   */
  getRemainingMetrics(
    journey: ActiveJourney,
    currentStepDistanceMeters: number
  ): { remainingMeters: number; remainingMinutes: number } {
    let remainingMeters = currentStepDistanceMeters;
    let remainingMinutes = 0;

    for (let i = journey.currentStepIndex + 1; i < journey.steps.length; i++) {
      const s = journey.steps[i]!;
      remainingMeters += s.distanceMeters || 0;
      remainingMinutes += s.estimatedMinutes || 2;
    }

    // Add remaining minutes for current step (~1 min per 80m walking or 200m transit)
    remainingMinutes += Math.max(1, Math.round(currentStepDistanceMeters / 100));

    return {
      remainingMeters,
      remainingMinutes,
    };
  },
};
