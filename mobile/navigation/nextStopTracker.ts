import { Coordinates, calculateHaversineDistance } from '../utils/geoUtils';
import { JourneyStep, UserLocation } from '../types/journey.types';
import { NextStopInfo } from './navigationTypes';

export class NextStopTracker {
  private static ALIGHTING_APPROACH_THRESHOLD_METERS = 150;
  private static STOP_PASSED_PROXIMITY_METERS = 80;

  /**
   * Tracks in-transit stop progress, estimating remaining stops and next stop name
   */
  trackNextStop(
    userLocation: UserLocation,
    currentStep: JourneyStep,
    alightingStopCoord?: Coordinates
  ): NextStopInfo {
    const totalStops = Math.max(1, currentStep.stopsCount || 1);
    const targetCoord: Coordinates = alightingStopCoord || {
      latitude: currentStep.latitude || userLocation.latitude,
      longitude: currentStep.longitude || userLocation.longitude,
    };

    const distToAlight = calculateHaversineDistance(userLocation, targetCoord);
    const isApproachingAlight = distToAlight <= NextStopTracker.ALIGHTING_APPROACH_THRESHOLD_METERS;

    // Estimate stops passed based on distance traveled vs total step distance
    const totalStepDistance = Math.max(100, currentStep.distanceMeters || distToAlight);
    const fractionRemaining = Math.max(0, Math.min(1, distToAlight / totalStepDistance));
    const stopsRemaining = isApproachingAlight
      ? 1
      : Math.max(1, Math.round(fractionRemaining * totalStops));

    const currentStopName = currentStep.fromStopName || 'Origin Station';
    const nextStopName =
      stopsRemaining <= 1
        ? currentStep.toStopName || 'Destination Station'
        : `Stop ${totalStops - stopsRemaining + 1} of ${totalStops}`;

    // Estimated distance to next intermediate stop
    const distToNext = stopsRemaining <= 1 ? distToAlight : Math.round(distToAlight / stopsRemaining);

    return {
      currentStopName,
      nextStopName,
      nextStopCode: currentStep.routeCode,
      stopsRemaining,
      distanceToNextStopMeters: Math.round(distToNext),
      distanceToAlightingStopMeters: Math.round(distToAlight),
      isApproachingAlight,
    };
  }

  /**
   * Checks if user has reached the final alighting stop
   */
  hasReachedAlightStop(userLocation: UserLocation, alightingCoord: Coordinates): boolean {
    const dist = calculateHaversineDistance(userLocation, alightingCoord);
    return dist <= NextStopTracker.STOP_PASSED_PROXIMITY_METERS;
  }
}

export const nextStopTracker = new NextStopTracker();
