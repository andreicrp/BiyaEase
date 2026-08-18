export type JourneyMode = 'walking' | 'jeepney' | 'bus' | 'mrt' | 'lrt' | 'uvexpress' | 'tricycle';

export interface JourneyStop {
  id: string;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
}

export interface JourneySegment {
  type: 'walking' | 'transit';
  mode: JourneyMode;
  routeId?: string;
  routeName?: string;
  routeCode?: string;
  modeColor?: string;
  fromStop?: JourneyStop;
  toStop?: JourneyStop;
  durationMinutes: number;
  distanceMeters: number;
  fare: number;
  instructions: string;
  stopsCount?: number;
  departureTime?: string;
  arrivalTime?: string;
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
}

export interface Journey {
  id: string;
  label?: 'FASTEST' | 'CHEAPEST' | 'LESS WALKING' | 'FEWER TRANSFERS';
  isRecommended?: boolean;
  durationMinutes: number;
  fare: number;
  currency: 'PHP';
  walkingDistanceMeters: number;
  transfers: number;
  modes: JourneyMode[];
  summary: string;
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
  segments: JourneySegment[];
}

export interface TransitStopNode {
  id: string;
  code: string | null;
  name: string;
  latitude: number;
  longitude: number;
}

export interface TransitEdge {
  fromStopId: string;
  toStopId: string;
  tripId: string;
  routeId: string;
  routeName: string;
  routeCode: string;
  routeVariantId: string;
  mode: JourneyMode;
  modeColor: string;
  fromSequence: number;
  toSequence: number;
  departureTime: string;
  arrivalTime: string;
  durationSeconds: number;
  distanceMeters: number;
  fare: number;
  shapeCoordinates?: [number, number][];
}

export interface WalkingEdge {
  fromStopId: string;
  toStopId: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RoutingSearchState {
  currentStopId: string;
  elapsedSeconds: number;
  totalFare: number;
  walkingDistanceMeters: number;
  transferCount: number;
  currentRouteId?: string;
  currentMode?: JourneyMode;
  path: (TransitEdge | WalkingEdge)[];
  visitedStops: Set<string>;
}
