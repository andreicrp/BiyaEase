/**
 * GTFS Standard Route Types:
 * 0 - Tram, Streetcar, Light rail (LRT)
 * 1 - Subway, Metro (MRT)
 * 2 - Rail
 * 3 - Bus
 * 4 - Ferry
 * 5 - Cable tram
 * 6 - Aerial lift
 * 7 - Funicular
 * 715 - Extended GTFS: Demand and Response (Jeepney / Shared Taxi)
 */

export interface SourceModeMappingConfig {
  source?: string;
  mappings?: Record<string, string>;
}

export class ModeMapper {
  private customMappings: Map<string, string> = new Map();

  constructor(config?: SourceModeMappingConfig) {
    if (config?.mappings) {
      for (const [key, val] of Object.entries(config.mappings)) {
        this.customMappings.set(key.toUpperCase(), val.toLowerCase());
      }
    }
  }

  /**
   * Resolves a GTFS route_type or Philippine route code to a BiyaEase transit mode ID
   */
  public resolveMode(rawRouteType: string | number, routeCodeOrName?: string): string {
    const rawStr = String(rawRouteType).trim().toUpperCase();

    // 1. Check custom feed mappings if provided
    if (this.customMappings.has(rawStr)) {
      const mapped = this.customMappings.get(rawStr);
      return this.toModeId(mapped ?? 'bus');
    }

    // 2. Check route code / text heuristics for Philippine modes
    const indicator = `${rawStr} ${routeCodeOrName ?? ''}`.toUpperCase();
    if (indicator.includes('JEEP') || rawStr === '715' || rawStr === 'JEEPNEY') {
      return 'mode-jeepney';
    }
    if (indicator.includes('UV') || indicator.includes('EXPRESS') || rawStr === 'UV_EXPRESS') {
      return 'mode-uv';
    }
    if (indicator.includes('TRIKE') || indicator.includes('TRICYCLE')) {
      return 'mode-tricycle';
    }
    if (indicator.includes('MRT') || rawStr === '1') {
      return 'mode-mrt';
    }
    if (indicator.includes('LRT') || rawStr === '0') {
      return 'mode-lrt';
    }
    if (indicator.includes('BUS') || rawStr === '3') {
      return 'mode-bus';
    }

    // Default fallback to bus
    return 'mode-bus';
  }

  private toModeId(modeCode: string): string {
    switch (modeCode.toLowerCase()) {
      case 'jeepney':
      case 'jeep':
        return 'mode-jeepney';
      case 'bus':
        return 'mode-bus';
      case 'mrt':
        return 'mode-mrt';
      case 'lrt':
        return 'mode-lrt';
      case 'uv_express':
      case 'uv':
        return 'mode-uv';
      case 'tricycle':
      case 'trike':
        return 'mode-tricycle';
      case 'walking':
        return 'mode-walking';
      default:
        return 'mode-bus';
    }
  }
}
