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

export interface RoutingSearchRequest {
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
  maxWalkingDistanceMeters?: number;
  maxTransfers?: number;
  limit?: number;
}
