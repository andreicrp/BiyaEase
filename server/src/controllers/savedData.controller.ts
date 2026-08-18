import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { savedDataService } from '../services/savedData.service.js';

export class SavedDataController {
  async getSavedPlaces(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const places = await savedDataService.getSavedPlaces(req.user!.id);
      res.status(200).json({ success: true, data: places });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch saved places';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async savePlace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await savedDataService.savePlace(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save place';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async deletePlace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await savedDataService.deletePlace(req.user!.id, id!);
      res.status(200).json({ success, message: success ? 'Deleted' : 'Not found' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete place';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async getFavoriteRoutes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const routes = await savedDataService.getFavoriteRoutes(req.user!.id);
      res.status(200).json({ success: true, data: routes });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch favorite routes';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async saveFavoriteRoute(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await savedDataService.saveFavoriteRoute(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save favorite route';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async deleteFavoriteRoute(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await savedDataService.deleteFavoriteRoute(req.user!.id, id!);
      res.status(200).json({ success, message: success ? 'Deleted' : 'Not found' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete route';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async syncPlaces(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { localPlaces } = req.body || {};
      const places = await savedDataService.syncLocalPlaces(req.user!.id, localPlaces);
      res.status(200).json({ success: true, data: places });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to sync places';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async syncRoutes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { localRoutes } = req.body || {};
      const routes = await savedDataService.syncLocalRoutes(req.user!.id, localRoutes);
      res.status(200).json({ success: true, data: routes });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to sync routes';
      res.status(500).json({ success: false, error: msg });
    }
  }
}

export const savedDataController = new SavedDataController();
