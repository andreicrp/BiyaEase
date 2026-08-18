import { vehicleRepository } from '../repositories/vehicle.repository.js';

export class VehicleService {
  async updateVehiclePosition(payload: {
    vehicleId: string;
    tripId?: string;
    routeId?: string;
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  }) {
    if (!payload.vehicleId || payload.vehicleId.trim().length === 0) {
      throw new Error('Vehicle ID is required');
    }
    if (payload.latitude < -90 || payload.latitude > 90 || payload.longitude < -180 || payload.longitude > 180) {
      throw new Error('Invalid coordinate boundaries');
    }

    return vehicleRepository.upsertVehiclePosition({
      vehicleId: payload.vehicleId.trim(),
      tripId: payload.tripId,
      routeId: payload.routeId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      bearing: payload.bearing,
      speed: payload.speed,
    });
  }

  async getNearbyVehicles(latitude: number, longitude: number, radiusMeters: number = 5000) {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid query coordinates');
    }
    const safeRadius = Math.max(100, Math.min(50000, radiusMeters));
    return vehicleRepository.getNearbyVehicles(latitude, longitude, safeRadius);
  }
}

export const vehicleService = new VehicleService();
