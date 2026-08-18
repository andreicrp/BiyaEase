export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version?: string;
  database?: 'connected' | 'disconnected' | 'unconfigured';
  postgis?: string;
  timestamp?: string;
}

export interface RootApiResponse {
  name: string;
  version: string;
  description: string;
  environment: string;
  docs?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  count?: number;
  error?: {
    message: string;
    code?: string;
  };
}
