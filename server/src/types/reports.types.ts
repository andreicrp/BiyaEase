export type ReportType =
  | 'traffic'
  | 'crowding'
  | 'unavailable'
  | 'delay'
  | 'route_issue'
  | 'stop_issue'
  | 'fare_change'
  | 'road_blocked'
  | 'other';

export type ReportStatus = 'active' | 'expired' | 'dismissed' | 'removed';

export interface DbCommunityReport {
  id: string;
  user_id: string;
  type: ReportType;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  expires_at: Date;
  status: ReportStatus;
  confirmed_count: number;
  created_at: Date;
  updated_at: Date;
  distance_meters?: number;
  author_name?: string;
}

export interface CreateReportPayload {
  type: ReportType;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  expirationHours?: number;
}
