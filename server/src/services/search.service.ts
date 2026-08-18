import {
  searchRepository,
  RawSearchEntity,
  SearchOptions,
} from '../repositories/search.repository.js';

export type SearchResultType = 'place' | 'stop' | 'station' | 'route';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  category?: string;
  mode?: string;
  modeColor?: string;
  routeCode?: string;
  distanceMeters?: number;
}

export class SearchService {
  async search(options: SearchOptions): Promise<SearchResult[]> {
    if (!options.queryText || options.queryText.trim().length === 0) {
      return [];
    }

    const rawEntities = await searchRepository.searchAll(options);

    return rawEntities.map((entity) => this.normalizeResult(entity));
  }

  private normalizeResult(raw: RawSearchEntity): SearchResult {
    return {
      id: raw.id,
      type: raw.entity_type,
      name: raw.name,
      subtitle: raw.subtitle,
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      category: raw.category || undefined,
      mode: raw.mode || undefined,
      modeColor: raw.mode_color || undefined,
      routeCode: raw.route_code || undefined,
      distanceMeters: raw.distance_meters !== null ? Number(raw.distance_meters) : undefined,
    };
  }
}

export const searchService = new SearchService();
