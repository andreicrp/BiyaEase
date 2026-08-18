import { Coordinates, calculateHaversineDistance } from '../utils/geoUtils';
import {
  NavigationContextUpdate,
  NavigationState,
  NavigationStatus,
} from './navigationTypes';
import { navigationMatcher } from './navigationMatcher';
import { nextStopTracker } from './nextStopTracker';
import { offRouteDetector } from './offRouteDetector';
import { alertService } from '../services/alertService';
import { hapticService } from '../services/hapticService';
import { audioAlertService } from '../services/audioAlertService';

export class NavigationEngine {
  private static BOARDING_APPROACH_DISTANCE_METERS = 120;
  private static BOARDING_ARRIVED_DISTANCE_METERS = 50;
  private static ALIGHTING_APPROACH_DISTANCE_METERS = 150;
  private static ALIGHTING_ARRIVED_DISTANCE_METERS = 60;
  private static DESTINATION_ARRIVED_DISTANCE_METERS = 40;

  private lastState: NavigationState | null = null;

  /**
   * Resets engine state for a new active journey
   */
  reset(): void {
    offRouteDetector.reset();
    alertService.reset();
    this.lastState = null;
  }

  /**
   * Deterministically processes a GPS update and computes the new NavigationState
   */
  update(context: NavigationContextUpdate): NavigationState {
    const { userLocation, currentStep, nextStep, stepIndex, polylineCoordinates } = context;

    // 1. Calculate Target Coordinate
    const targetCoord: Coordinates = {
      latitude: currentStep.latitude || userLocation.latitude,
      longitude: currentStep.longitude || userLocation.longitude,
    };

    const directDistanceToTarget = calculateHaversineDistance(userLocation, targetCoord);

    // 2. Perform Polyline Route Matching
    const stepPolyline =
      polylineCoordinates && polylineCoordinates.length > 0
        ? polylineCoordinates
        : [
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            targetCoord,
          ];

    const matchedProgress = navigationMatcher.matchLocationToPolyline(
      userLocation,
      stepPolyline,
      250
    );

    // 3. Evaluate Off-Route and Wrong-Direction Status
    const targetName = currentStep.fromStopName || currentStep.toStopName || currentStep.title;
    const offRouteStatus = offRouteDetector.evaluateLocation(
      userLocation,
      targetCoord,
      matchedProgress.distanceFromRouteMeters,
      targetName
    );

    // 4. In-Transit Next Stop Tracking (if transit step)
    const isTransitStep =
      currentStep.type === 'transit' ||
      currentStep.mode === 'jeepney' ||
      currentStep.mode === 'bus' ||
      currentStep.mode === 'mrt' ||
      currentStep.mode === 'lrt' ||
      currentStep.mode === 'uvexpress';

    const nextStopInfo = isTransitStep
      ? nextStopTracker.trackNextStop(userLocation, currentStep, targetCoord)
      : undefined;

    // 5. Determine Navigation Status via State Machine
    let status: NavigationStatus = 'walking_to_board';

    if (offRouteStatus.isOffRoute) {
      status = 'off_route';
      const { isNew } = alertService.triggerAlert(
        stepIndex,
        'off_route',
        'Off Planned Route',
        offRouteStatus.recoveryGuidance || 'Head back to your commute corridor.'
      );
      if (isNew) {
        hapticService.trigger('offRoute');
        audioAlertService.playAlert('offroute');
      }
    } else if (currentStep.type === 'destination' || currentStep.completed) {
      if (directDistanceToTarget <= NavigationEngine.DESTINATION_ARRIVED_DISTANCE_METERS) {
        status = 'arrived';
        const { isNew } = alertService.triggerAlert(
          stepIndex,
          'arrival',
          'You Have Arrived!',
          `Safely reached ${currentStep.title || 'your destination'}.`
        );
        if (isNew) {
          hapticService.trigger('destinationArrival');
          audioAlertService.playAlert('arrival');
        }
      } else {
        status = 'walking_to_destination';
      }
    } else if (currentStep.type === 'board') {
      if (directDistanceToTarget <= NavigationEngine.BOARDING_ARRIVED_DISTANCE_METERS) {
        status = 'boarding';
        const { isNew } = alertService.triggerAlert(
          stepIndex,
          'boarding',
          "You're at your stop",
          `Ready to board ${currentStep.routeCode || currentStep.mode?.toUpperCase() || 'transit'}.`,
          currentStep.mode
        );
        if (isNew) {
          hapticService.trigger('boardingArrival');
          audioAlertService.playAlert('boarding');
        }
      } else if (directDistanceToTarget <= NavigationEngine.BOARDING_APPROACH_DISTANCE_METERS) {
        status = 'approaching_board';
        const { isNew } = alertService.triggerAlert(
          stepIndex,
          'boarding',
          'Approaching Boarding Stop',
          `${Math.round(directDistanceToTarget)}m to ${currentStep.title}`,
          currentStep.mode
        );
        if (isNew) {
          hapticService.trigger('boardingApproach');
          audioAlertService.playAlert('boarding');
        }
      } else {
        status = 'walking_to_board';
      }
    } else if (isTransitStep) {
      if (directDistanceToTarget <= NavigationEngine.ALIGHTING_ARRIVED_DISTANCE_METERS) {
        status = 'alighting';
        const { isNew } = alertService.triggerAlert(
          stepIndex,
          'alighting',
          "You're at your alight stop",
          `Get off at ${currentStep.toStopName || currentStep.title}.`,
          currentStep.mode
        );
        if (isNew) {
          hapticService.trigger('alightingApproach');
          audioAlertService.playAlert('alighting');
        }
      } else if (
        nextStopInfo?.isApproachingAlight ||
        directDistanceToTarget <= NavigationEngine.ALIGHTING_APPROACH_DISTANCE_METERS
      ) {
        status = 'approaching_alight';
        const { isNew } = alertService.triggerAlert(
          stepIndex,
          'alighting',
          'Get Ready to Alight',
          `${Math.round(directDistanceToTarget)}m to ${currentStep.toStopName || 'alight stop'}`,
          currentStep.mode
        );
        if (isNew) {
          hapticService.trigger('alightingApproach');
          audioAlertService.playAlert('alighting');
        }
      } else {
        status = 'in_transit';
      }
    } else if (currentStep.type === 'transfer') {
      status = 'transfer';
      const nextMode = nextStep?.mode?.toUpperCase() || 'Next Transit';
      const { isNew } = alertService.triggerAlert(
        stepIndex,
        'transfer',
        'Transfer Coming Up',
        `Transfer to ${nextMode} after this stop.`,
        currentStep.mode
      );
      if (isNew) {
        hapticService.trigger('transfer');
        audioAlertService.playAlert('transfer');
      }
    } else {
      status = 'walking_to_board';
    }

    // 6. Compute Remaining Distance & Estimated Time
    const effectiveRemainingDistance = Math.min(
      directDistanceToTarget,
      matchedProgress.remainingDistanceMeters || directDistanceToTarget
    );

    const walkingSpeedMps = 1.3; // ~4.7 km/h
    const transitSpeedMps = 5.5; // ~20 km/h
    const speed = isTransitStep ? transitSpeedMps : walkingSpeedMps;
    const estimatedMinutes = Math.max(1, Math.round(effectiveRemainingDistance / (speed * 60)));

    // Extract active alert from alert history
    const history = alertService.getHistory();
    const activeAlert = history.length > 0 ? history[history.length - 1] : null;

    const state: NavigationState = {
      status,
      currentStepIndex: stepIndex,
      currentStep,
      distanceToTargetMeters: Math.round(effectiveRemainingDistance),
      estimatedRemainingMinutes: estimatedMinutes,
      progressPercent: matchedProgress.progressPercent,
      matchedProgress,
      nextStopInfo,
      offRouteStatus,
      activeAlert,
      alertHistory: history,
      heading: userLocation.heading,
      lastUpdatedAt: Date.now(),
    };

    this.lastState = state;
    return state;
  }

  getLastState(): NavigationState | null {
    return this.lastState;
  }
}

export const navigationEngine = new NavigationEngine();
