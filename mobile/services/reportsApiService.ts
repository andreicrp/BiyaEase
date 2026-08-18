import { authApiService } from './authApiService';

const API_BASE_URL = 'http://localhost:5000/api';

export type ReportCategory =
  | 'traffic'
  | 'crowding'
  | 'unavailable'
  | 'delay'
  | 'route_issue'
  | 'stop_issue'
  | 'fare_change'
  | 'road_blocked'
  | 'other';

export interface CommunityReport {
  id: string;
  user_id: string;
  type: ReportCategory;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  expires_at: string;
  status: 'active' | 'expired' | 'dismissed' | 'removed';
  confirmed_count: number;
  created_at: string;
  distance_meters?: number;
  author_name?: string;
}

export class ReportsApiService {
  async getNearbyReports(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<{ success: boolean; data?: CommunityReport[]; error?: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusMeters}`
      );
      return await response.json();
    } catch {
      return { success: false, error: 'Network error fetching nearby reports' };
    }
  }

  async createReport(payload: {
    type: ReportCategory;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    expirationHours?: number;
  }): Promise<{ success: boolean; data?: CommunityReport; error?: string }> {
    const token = authApiService.getToken();
    if (!token) {
      return { success: false, error: 'Please sign in to submit a transit report.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error creating report' };
    }
  }

  async confirmReport(
    id: string
  ): Promise<{ success: boolean; data?: { confirmedCount: number }; error?: string }> {
    const token = authApiService.getToken();
    if (!token) {
      return { success: false, error: 'Please sign in to confirm reports.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error confirming report' };
    }
  }
}

export const reportsApiService = new ReportsApiService();
