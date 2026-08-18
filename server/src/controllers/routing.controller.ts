import { Request, Response, NextFunction } from 'express';
import { routingService } from '../services/routing.service.js';

export class RoutingController {
  /**
   * POST /api/routes/search
   * Calculate multimodal routes between origin and destination coordinates.
   */
  async searchRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { origin, destination, maxWalkingDistanceMeters, maxTransfers, limit } = req.body || {};

      // 1. Validate Origin
      if (
        !origin ||
        typeof origin.latitude !== 'number' ||
        typeof origin.longitude !== 'number' ||
        origin.latitude < -90 ||
        origin.latitude > 90 ||
        origin.longitude < -180 ||
        origin.longitude > 180 ||
        isNaN(origin.latitude) ||
        isNaN(origin.longitude)
      ) {
        res.status(400).json({
          success: false,
          error:
            'Valid origin coordinate with latitude (-90 to 90) and longitude (-180 to 180) is required.',
        });
        return;
      }

      // 2. Validate Destination
      if (
        !destination ||
        typeof destination.latitude !== 'number' ||
        typeof destination.longitude !== 'number' ||
        destination.latitude < -90 ||
        destination.latitude > 90 ||
        destination.longitude < -180 ||
        destination.longitude > 180 ||
        isNaN(destination.latitude) ||
        isNaN(destination.longitude)
      ) {
        res.status(400).json({
          success: false,
          error:
            'Valid destination coordinate with latitude (-90 to 90) and longitude (-180 to 180) is required.',
        });
        return;
      }

      // 3. Optional Bounds Validation
      const parsedMaxWalk =
        typeof maxWalkingDistanceMeters === 'number'
          ? Math.min(3000, Math.max(100, maxWalkingDistanceMeters))
          : 1000;

      const parsedMaxTransfers =
        typeof maxTransfers === 'number' ? Math.min(3, Math.max(0, maxTransfers)) : 3;

      const parsedLimit = typeof limit === 'number' ? Math.min(10, Math.max(1, limit)) : 5;

      const routes = await routingService.planJourney({
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude,
          name: origin.name,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          name: destination.name,
        },
        maxWalkingDistanceMeters: parsedMaxWalk,
        maxTransfers: parsedMaxTransfers,
        limit: parsedLimit,
      });

      res.status(200).json({
        success: true,
        data: {
          routes,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const routingController = new RoutingController();
