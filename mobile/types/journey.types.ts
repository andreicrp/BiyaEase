export type JourneyStatus =
  | 'ready'
  | 'walking_to_stop'
  | 'boarding'
  | 'in_transit'
  | 'alighting'
  | 'walking_to_destination'
  | 'completed'
  | 'cancelled';

export type JourneyStepType = 'walk' | 'board' | 'transit' | 'transfer' | 'alight' | 'destination';

export interface JourneyStep {
  id: string;
  type: JourneyStepType;
  title: string;
  subtitle?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  estimatedMinutes?: number;
  routeId?: number | string;
  routeName?: string;
  routeCode?: string;
  mode?: string;
  fromStopId?: number | string;
  fromStopName?: string;
  toStopId?: number | string;
  toStopName?: string;
  stopsCount?: number;
  fare?: number;
  completed: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface ActiveJourney {
  id: string;
  status: JourneyStatus;
  startedAt?: string;
  completedAt?: string;
  origin: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  totalFare?: number;
  totalDurationMinutes?: number;
  steps: JourneyStep[];
  currentStepIndex: number;
  currentLocation?: UserLocation;
  polylineCoordinates?: { latitude: number; longitude: number }[];
}
