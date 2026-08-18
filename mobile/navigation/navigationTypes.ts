import { Coordinates } from '../utils/geoUtils';
import { JourneyStep, UserLocation } from '../types/journey.types';

export type NavigationStatus =
  | 'walking_to_board'
  | 'approaching_board'
  | 'boarding'
  | 'in_transit'
  | 'approaching_alight'
  | 'alighting'
  | 'transfer'
  | 'walking_to_destination'
  | 'arrived'
  | 'off_route';

export interface MatchedRouteProgress {
  closestPoint: Coordinates;
  distanceFromRouteMeters: number;
  progressPercent: number; // 0 - 100%
  remainingDistanceMeters: number;
  isNearRoute: boolean;
}

export interface NextStopInfo {
  currentStopName?: string;
  nextStopName?: string;
  nextStopCode?: string;
  stopsRemaining: number;
  distanceToNextStopMeters: number;
  distanceToAlightingStopMeters: number;
  isApproachingAlight: boolean;
}

export interface OffRouteStatus {
  isOffRoute: boolean;
  isMovingWrongDirection: boolean;
  consecutiveOffRouteReadings: number;
  deviationMeters: number;
  recoveryGuidance?: string;
}

export type AlertType = 'boarding' | 'alighting' | 'transfer' | 'arrival' | 'off_route';

export interface NavigationAlert {
  id: string;
  type: AlertType;
  stepIndex: number;
  title: string;
  subtitle: string;
  mode?: string;
  triggeredAt: number;
}

export interface NavigationState {
  status: NavigationStatus;
  currentStepIndex: number;
  currentStep: JourneyStep | null;
  distanceToTargetMeters: number;
  estimatedRemainingMinutes: number;
  progressPercent: number;
  matchedProgress?: MatchedRouteProgress;
  nextStopInfo?: NextStopInfo;
  offRouteStatus: OffRouteStatus;
  activeAlert?: NavigationAlert | null;
  alertHistory: NavigationAlert[];
  heading?: number;
  lastUpdatedAt: number;
}

export interface NavigationContextUpdate {
  userLocation: UserLocation;
  currentStep: JourneyStep;
  nextStep?: JourneyStep;
  allSteps: JourneyStep[];
  stepIndex: number;
  polylineCoordinates?: Coordinates[];
}
