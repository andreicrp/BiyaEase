/**
 * Normalized BiyaEase Domain Entities for Database Persistence
 */

export interface NormalizedAgency {
  id: string;
  source_id: string;
  dataset_id: string;
  external_id: string;
  name: string;
  code: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
}

export interface NormalizedRoute {
  id: string;
  source_id: string;
  dataset_id: string;
  external_id: string;
  agency_id: string | null;
  mode_id: string;
  code: string;
  name: string;
  description: string | null;
  route_color: string;
  is_active: boolean;
  source: string;
}

export interface NormalizedRouteVariant {
  id: string;
  dataset_id: string;
  external_id: string;
  route_id: string;
  name: string;
  direction: string;
  description: string | null;
  is_active: boolean;
}

export interface NormalizedStop {
  id: string;
  source_id: string;
  dataset_id: string;
  external_id: string;
  code: string | null;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  source: string;
}

export interface NormalizedService {
  id: string;
  code: string;
  name: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_date: string;
  end_date: string;
}

export interface NormalizedTrip {
  id: string;
  dataset_id: string;
  external_id: string;
  route_variant_id: string;
  service_id: string | null;
  code: string | null;
  headsign: string;
  direction: string;
  is_active: boolean;
}

export interface NormalizedStopTime {
  id: string;
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  arrival_time: string | null;
  departure_time: string | null;
}

export interface NormalizedShape {
  id: string;
  dataset_id: string;
  external_id: string;
  route_variant_id: string;
  lineWkt: string;
  total_distance_meters: number;
  source: string;
}
