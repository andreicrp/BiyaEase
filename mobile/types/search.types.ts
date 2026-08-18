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

export interface SelectedLocation {
  id: string;
  name: string;
  type: SearchResultType;
  latitude: number;
  longitude: number;
  subtitle?: string;
  mode?: string;
  category?: string;
}

export interface RecentSearchItem {
  id: string;
  query: string;
  name: string;
  type: SearchResultType;
  latitude: number;
  longitude: number;
  subtitle?: string;
  timestamp: string;
}
