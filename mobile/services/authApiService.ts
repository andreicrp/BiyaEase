import { localStorageService } from './localStorageService';

const API_BASE_URL = 'http://localhost:5000/api';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AuthApiResponse {
  success: boolean;
  data?: {
    user: UserProfile;
    token: string;
  };
  error?: string;
}

class AuthApiService {
  private token: string | null = null;

  async initToken(): Promise<string | null> {
    this.token = await localStorageService.getItem<string>('biyaease.authToken.v1');
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorageService.setItem('biyaease.authToken.v1', token);
    } else {
      localStorageService.removeItem('biyaease.authToken.v1');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async register(email: string, password: string, displayName: string): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        this.setToken(data.data.token);
      }
      return data;
    } catch {
      return { success: false, error: 'Network error during registration' };
    }
  }

  async login(email: string, password: string): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        this.setToken(data.data.token);
      }
      return data;
    } catch {
      return { success: false, error: 'Network error during login' };
    }
  }

  async getCurrentUser(): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    if (!this.token) return { success: false, error: 'No token' };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error during profile fetch' };
    }
  }

  async syncPlaces(localPlaces: any[]): Promise<{ success: boolean; data?: any[] }> {
    if (!this.token) return { success: false };

    try {
      const response = await fetch(`${API_BASE_URL}/saved/places/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ localPlaces }),
      });
      return await response.json();
    } catch {
      return { success: false };
    }
  }

  async syncRoutes(localRoutes: any[]): Promise<{ success: boolean; data?: any[] }> {
    if (!this.token) return { success: false };

    try {
      const response = await fetch(`${API_BASE_URL}/saved/routes/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ localRoutes }),
      });
      return await response.json();
    } catch {
      return { success: false };
    }
  }
}

export const authApiService = new AuthApiService();
