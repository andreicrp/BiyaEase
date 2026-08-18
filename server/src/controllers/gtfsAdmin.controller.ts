import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { gtfsAdminService } from '../services/gtfsAdmin.service.js';

export class GtfsAdminController {
  async getAgencies(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const agencies = await gtfsAdminService.getAgencies();
      res.status(200).json({ success: true, count: agencies.length, data: agencies });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch agencies';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async getRoutes(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const routes = await gtfsAdminService.getRoutes();
      res.status(200).json({ success: true, count: routes.length, data: routes });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch routes';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async saveRoute(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await gtfsAdminService.createOrUpdateRoute(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save GTFS route';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async deleteRoute(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await gtfsAdminService.deleteRoute(id!);
      res.status(200).json({ success });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete route';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async getStops(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const stops = await gtfsAdminService.getStops(limit);
      res.status(200).json({ success: true, count: stops.length, data: stops });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch stops';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async saveStop(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await gtfsAdminService.createOrUpdateStop(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save GTFS stop';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async deleteStop(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await gtfsAdminService.deleteStop(id!);
      res.status(200).json({ success });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete stop';
      res.status(500).json({ success: false, error: msg });
    }
  }
}

export const gtfsAdminController = new GtfsAdminController();
