const API_BASE_URL = 'http://localhost:5000/api';

export interface LiveVehicle {
  id: string;
  vehicle_id: string;
  trip_id?: string;
  route_id?: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  updated_at: string;
  distance_meters?: number;
  route_short_name?: string;
  route_long_name?: string;
}

export class VehicleApiService {
  async getNearbyVehicles(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<{ success: boolean; data?: LiveVehicle[]; error?: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/transit/vehicles/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusMeters}`
      );
      return await response.json();
    } catch {
      return { success: false, error: 'Network error fetching nearby vehicles' };
    }
  }

  async updateVehiclePosition(payload: {
    vehicleId: string;
    tripId?: string;
    routeId?: string;
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  }): Promise<{ success: boolean; data?: LiveVehicle; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/transit/vehicles/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error updating vehicle position' };
    }
  }
}

export const vehicleApiService = new VehicleApiService();
