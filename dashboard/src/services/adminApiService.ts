const API_BASE_URL = 'http://localhost:5000/api';

export interface SystemMetrics {
  totalUsers: number;
  activeReports: number;
  totalSavedPlaces: number;
  totalFavoriteRoutes: number;
  totalGtfsRoutes: number;
  totalGtfsStops: number;
}

export interface AdminReport {
  id: string;
  user_id: string;
  type: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  expires_at: string;
  status: 'active' | 'expired' | 'dismissed' | 'removed';
  confirmed_count: number;
  created_at: string;
  author_name?: string;
  author_email?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  savedPlacesCount: number;
  reportsCount: number;
}

export class AdminApiService {
  async fetchHealth(): Promise<{ status: string; uptime: number; database: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await res.json();
    } catch {
      return { status: 'offline', uptime: 0, database: 'disconnected' };
    }
  }

  async fetchMetrics(token: string): Promise<{ success: boolean; data?: SystemMetrics; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Network error fetching metrics' };
    }
  }

  async fetchReports(
    token: string,
    statusFilter?: string
  ): Promise<{ success: boolean; data?: AdminReport[]; error?: string }> {
    try {
      const url = statusFilter ? `${API_BASE_URL}/admin/reports?status=${statusFilter}` : `${API_BASE_URL}/admin/reports`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Network error fetching reports' };
    }
  }

  async moderateReport(
    token: string,
    id: string,
    action: 'approve' | 'dismiss' | 'delete'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reports/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Network error performing moderation action' };
    }
  }

  async fetchUsers(token: string): Promise<{ success: boolean; data?: AdminUser[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Network error fetching user directory' };
    }
  }
}

export const adminApiService = new AdminApiService();
