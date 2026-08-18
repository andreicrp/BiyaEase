import crypto from 'crypto';
import {
  RawGtfsAgency,
  RawGtfsRoute,
  RawGtfsStop,
  RawGtfsTrip,
  RawGtfsStopTime,
  RawGtfsCalendar,
} from '../types/gtfs.types.js';
import {
  NormalizedAgency,
  NormalizedRoute,
  NormalizedRouteVariant,
  NormalizedStop,
  NormalizedService,
  NormalizedTrip,
  NormalizedStopTime,
} from '../types/normalized.types.js';
import { ModeMapper } from './modeMapper.js';

export class EntityNormalizer {
  private sourceId: string;
  private datasetId: string;
  private modeMapper: ModeMapper;

  constructor(sourceId: string, datasetId: string, modeMapper?: ModeMapper) {
    this.sourceId = sourceId;
    this.datasetId = datasetId;
    this.modeMapper = modeMapper ?? new ModeMapper();
  }

  public normalizeAgency(raw: RawGtfsAgency): NormalizedAgency {
    const extId = raw.agency_id?.trim() || raw.agency_name.trim();
    const id = `agency-${this.generateHash(`${this.sourceId}:${extId}`)}`;

    return {
      id,
      source_id: this.sourceId,
      dataset_id: this.datasetId,
      external_id: extId,
      name: raw.agency_name.trim(),
      code:
        raw.agency_id?.trim() ||
        raw.agency_name.substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
      description: null,
      website: raw.agency_url?.trim() || null,
      phone: raw.agency_phone?.trim() || null,
      email: raw.agency_email?.trim() || null,
    };
  }

  public normalizeRoute(raw: RawGtfsRoute, resolvedAgencyId: string | null): NormalizedRoute {
    const extId = raw.route_id.trim();
    const id = `route-${this.generateHash(`${this.sourceId}:${extId}`)}`;
    const code = raw.route_short_name?.trim() || raw.route_long_name?.trim() || extId;
    const name = raw.route_long_name?.trim() || raw.route_short_name?.trim() || extId;
    const modeId = this.modeMapper.resolveMode(raw.route_type, `${code} ${name}`);

    return {
      id,
      source_id: this.sourceId,
      dataset_id: this.datasetId,
      external_id: extId,
      agency_id: resolvedAgencyId,
      mode_id: modeId,
      code,
      name,
      description: raw.route_desc?.trim() || null,
      route_color: raw.route_color ? `#${raw.route_color.replace('#', '')}` : '#0F766E',
      is_active: true,
      source: 'gtfs',
    };
  }

  public normalizeRouteVariant(
    route: NormalizedRoute,
    directionId: string | undefined,
    headsign?: string
  ): NormalizedRouteVariant {
    const dir =
      directionId === '1' || directionId?.toLowerCase() === 'inbound' ? 'inbound' : 'outbound';
    const extId = `${route.external_id}:${dir}`;
    const id = `var-${this.generateHash(`${this.datasetId}:${extId}`)}`;

    return {
      id,
      dataset_id: this.datasetId,
      external_id: extId,
      route_id: route.id,
      name: headsign ? `${route.name} (${headsign})` : `${route.name} (${dir})`,
      direction: dir,
      description: `Direction: ${dir}`,
      is_active: true,
    };
  }

  public normalizeStop(raw: RawGtfsStop): NormalizedStop {
    const extId = raw.stop_id.trim();
    const id = `stop-${this.generateHash(`${this.sourceId}:${extId}`)}`;

    return {
      id,
      source_id: this.sourceId,
      dataset_id: this.datasetId,
      external_id: extId,
      code: raw.stop_code?.trim() || extId,
      name: raw.stop_name.trim(),
      description: raw.stop_desc?.trim() || null,
      address: null,
      latitude: parseFloat(raw.stop_lat),
      longitude: parseFloat(raw.stop_lon),
      is_active: true,
      source: 'gtfs',
    };
  }

  public normalizeService(raw: RawGtfsCalendar): NormalizedService {
    const code = raw.service_id.trim();
    const id = `service-${this.generateHash(`${this.sourceId}:${code}`)}`;

    return {
      id,
      code,
      name: `Service Schedule (${code})`,
      monday: raw.monday === '1' || raw.monday.toLowerCase() === 'true',
      tuesday: raw.tuesday === '1' || raw.tuesday.toLowerCase() === 'true',
      wednesday: raw.wednesday === '1' || raw.wednesday.toLowerCase() === 'true',
      thursday: raw.thursday === '1' || raw.thursday.toLowerCase() === 'true',
      friday: raw.friday === '1' || raw.friday.toLowerCase() === 'true',
      saturday: raw.saturday === '1' || raw.saturday.toLowerCase() === 'true',
      sunday: raw.sunday === '1' || raw.sunday.toLowerCase() === 'true',
      start_date: this.formatGtfsDate(raw.start_date),
      end_date: this.formatGtfsDate(raw.end_date),
    };
  }

  public normalizeTrip(
    raw: RawGtfsTrip,
    variantId: string,
    resolvedServiceId: string | null
  ): NormalizedTrip {
    const extId = raw.trip_id.trim();
    const id = `trip-${this.generateHash(`${this.datasetId}:${extId}`)}`;
    const dir = raw.direction_id === '1' ? 'inbound' : 'outbound';

    return {
      id,
      dataset_id: this.datasetId,
      external_id: extId,
      route_variant_id: variantId,
      service_id: resolvedServiceId,
      code: raw.trip_short_name?.trim() || extId,
      headsign: raw.trip_headsign?.trim() || 'Transit Route',
      direction: dir,
      is_active: true,
    };
  }

  public normalizeStopTime(
    raw: RawGtfsStopTime,
    resolvedTripId: string,
    resolvedStopId: string
  ): NormalizedStopTime {
    const seq = parseInt(raw.stop_sequence, 10);
    const id = `st-${this.generateHash(`${resolvedTripId}:${seq}`)}`;

    return {
      id,
      trip_id: resolvedTripId,
      stop_id: resolvedStopId,
      stop_sequence: seq,
      arrival_time: raw.arrival_time?.trim() || null,
      departure_time: raw.departure_time?.trim() || null,
    };
  }

  private generateHash(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  private formatGtfsDate(rawDate: string): string {
    const clean = rawDate.trim();
    if (clean.length === 8 && /^\d{8}$/.test(clean)) {
      return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
    }
    return clean || '2026-01-01';
  }
}
