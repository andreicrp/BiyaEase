import { gtfsAdminRepository } from '../repositories/gtfsAdmin.repository.js';

export class GtfsAdminService {
  async getAgencies() {
    return gtfsAdminRepository.getAgencies();
  }

  async getRoutes() {
    return gtfsAdminRepository.getRoutes();
  }

  async createOrUpdateRoute(payload: {
    id: string;
    agencyId?: string;
    modeId?: string;
    code: string;
    name: string;
    description?: string;
    routeColor?: string;
  }) {
    if (!payload.id || !payload.code || !payload.name) {
      throw new Error('Route ID, route code, and route name are required');
    }
    return gtfsAdminRepository.createOrUpdateRoute(payload);
  }

  async deleteRoute(id: string) {
    return gtfsAdminRepository.deleteRoute(id);
  }

  async getStops(limit: number = 100) {
    return gtfsAdminRepository.getStops(limit);
  }

  async createOrUpdateStop(payload: {
    id: string;
    code?: string;
    name: string;
    latitude: number;
    longitude: number;
  }) {
    if (!payload.id || !payload.name) {
      throw new Error('Stop ID and stop name are required');
    }
    if (payload.latitude < -90 || payload.latitude > 90 || payload.longitude < -180 || payload.longitude > 180) {
      throw new Error('Invalid coordinate boundaries');
    }
    return gtfsAdminRepository.createOrUpdateStop(payload);
  }

  async deleteStop(id: string) {
    return gtfsAdminRepository.deleteStop(id);
  }
}

export const gtfsAdminService = new GtfsAdminService();
