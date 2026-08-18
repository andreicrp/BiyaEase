import { Coordinates, calculateHaversineDistance } from '../utils/geoUtils';
import { UserLocation } from '../types/journey.types';
import { OffRouteStatus } from './navigationTypes';

export class OffRouteDetector {
  private static OFF_ROUTE_THRESHOLD_METERS = 400;
  private static RECOVERY_THRESHOLD_METERS = 200;
  private static CONSECUTIVE_STRIKES_REQUIRED = 3;

  private offRouteStrikes = 0;
  private previousDistanceToTarget: number | null = null;
  private wrongDirectionStrikes = 0;
  private isCurrentlyOffRoute = false;

  /**
   * Reset detector state when switching journey steps
   */
  reset(): void {
    this.offRouteStrikes = 0;
    this.previousDistanceToTarget = null;
    this.wrongDirectionStrikes = 0;
    this.isCurrentlyOffRoute = false;
  }

  /**
   * Evaluates GPS reading against route corridor and target coordinates
   */
  evaluateLocation(
    userLocation: UserLocation,
    targetCoordinate: Coordinates,
    distanceFromCorridorMeters: number,
    targetName = 'your stop'
  ): OffRouteStatus {
    // 1. Off-Corridor Detection (3-strike rule)
    if (distanceFromCorridorMeters > OffRouteDetector.OFF_ROUTE_THRESHOLD_METERS) {
      this.offRouteStrikes += 1;
    } else if (distanceFromCorridorMeters <= OffRouteDetector.RECOVERY_THRESHOLD_METERS) {
      // Auto-recovery
      this.offRouteStrikes = 0;
      this.isCurrentlyOffRoute = false;
    }

    if (this.offRouteStrikes >= OffRouteDetector.CONSECUTIVE_STRIKES_REQUIRED) {
      this.isCurrentlyOffRoute = true;
    }

    // 2. Wrong-Direction Detection (for walking segments)
    const currentDistanceToTarget = calculateHaversineDistance(userLocation, targetCoordinate);
    let isMovingWrongDirection = false;

    if (this.previousDistanceToTarget !== null) {
      const delta = currentDistanceToTarget - this.previousDistanceToTarget;
      // Moving away by more than 15 meters in consecutive ticks
      if (delta > 15 && currentDistanceToTarget > 100) {
        this.wrongDirectionStrikes += 1;
      } else if (delta < -5) {
        this.wrongDirectionStrikes = Math.max(0, this.wrongDirectionStrikes - 1);
      }
    }

    if (this.wrongDirectionStrikes >= OffRouteDetector.CONSECUTIVE_STRIKES_REQUIRED) {
      isMovingWrongDirection = true;
    }

    this.previousDistanceToTarget = currentDistanceToTarget;

    let recoveryGuidance: string | undefined;
    if (this.isCurrentlyOffRoute) {
      recoveryGuidance = `You are ${distanceFromCorridorMeters}m off route. Head back toward ${targetName}.`;
    } else if (isMovingWrongDirection) {
      recoveryGuidance = `You are moving away from ${targetName}. Turn around and head toward the stop.`;
    }

    return {
      isOffRoute: this.isCurrentlyOffRoute,
      isMovingWrongDirection,
      consecutiveOffRouteReadings: this.offRouteStrikes,
      deviationMeters: distanceFromCorridorMeters,
      recoveryGuidance,
    };
  }

  getIsOffRoute(): boolean {
    return this.isCurrentlyOffRoute;
  }
}

export const offRouteDetector = new OffRouteDetector();
