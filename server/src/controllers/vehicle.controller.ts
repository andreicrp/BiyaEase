import { Request, Response } from 'express';
import { vehicleService } from '../services/vehicle.service.js';

export class VehicleController {
  async updatePosition(req: Request, res: Response): Promise<void> {
    try {
      const result = await vehicleService.updateVehiclePosition(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update vehicle position';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async getNearby(req: Request, res: Response): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000;

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ success: false, error: 'Query parameters lat and lng are required' });
        return;
      }

      const vehicles = await vehicleService.getNearbyVehicles(lat, lng, radius);
      res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch nearby vehicles';
      res.status(500).json({ success: false, error: msg });
    }
  }
}

export const vehicleController = new VehicleController();
