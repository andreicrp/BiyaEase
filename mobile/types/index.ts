export type TransitMode = 'jeepney' | 'bus' | 'mrt' | 'lrt' | 'uvexpress' | 'tricycle' | 'walking';

export type RouteBadgeType = 'FASTEST' | 'CHEAPEST' | 'LESS WALKING' | 'FEWER TRANSFERS';

export type SavedPlaceType = 'home' | 'work' | 'school' | 'other';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Destination {
  id: string;
  name: string;
  area: string;
  category: 'mall' | 'university' | 'station' | 'terminal' | 'landmark' | 'business';
  subtitle?: string;
  coordinates?: Coordinates;
}

export interface RouteStep {
  id: string;
  mode: TransitMode;
  title: string;
  subtitle: string;
  durationMinutes: number;
  distanceMeters: number;
  fare?: number;
  vehicleNumber?: string;
  originStop: string;
  destinationStop: string;
  stopsCount?: number;
  landmarkHint?: string;
  instructions: string;
}

export interface RouteOption {
  id: string;
  label: RouteBadgeType;
  isRecommended?: boolean;
  totalDurationMinutes: number;
  totalFare: number;
  walkingDistanceMeters: number;
  transfersCount: number;
  modes: TransitMode[];
  origin: string;
  destination: string;
  summary: string;
  steps: RouteStep[];
}

export interface RecentTrip {
  id: string;
  origin: string;
  destination: string;
  durationMinutes: number;
  fare: number;
  timestamp: string;
  modes: TransitMode[];
}

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  type: SavedPlaceType;
  customIcon?: string;
}

export interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  durationMinutes: number;
  fare: number;
  transfersCount: number;
  modes: TransitMode[];
}

export interface NearbyTransport {
  id: string;
  mode: TransitMode;
  routeName: string;
  heading: string;
  distanceMeters: number;
  etaMinutes: number;
  stopName: string;
  coordinates?: Coordinates;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  memberSince: string;
  totalTrips: number;
  favoriteMode: TransitMode;
}

export type RouteFilterCategory =
  'all' | 'fastest' | 'cheapest' | 'less_walking' | 'fewer_transfers';
