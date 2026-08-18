import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { reportsService } from '../services/reports.service.js';

export class ReportsController {
  async createReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await reportsService.createReport(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create report';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async getNearby(req: Request, res: Response): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000;

      if (isNaN(lat) || isNaN(lng)) {
        res
          .status(400)
          .json({ success: false, error: 'Query parameters lat and lng are required' });
        return;
      }

      const reports = await reportsService.getNearbyReports(lat, lng, radius);
      res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch nearby reports';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await reportsService.getReportById(id!);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Report not found';
      res.status(404).json({ success: false, error: msg });
    }
  }

  async confirmReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await reportsService.confirmReport(id!, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to confirm report';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async dismissReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await reportsService.dismissReport(id!);
      res.status(200).json({ success });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to dismiss report';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async deleteReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await reportsService.deleteReport(id!, req.user!.id);
      res.status(200).json({ success, message: success ? 'Deleted' : 'Not found' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete report';
      res.status(500).json({ success: false, error: msg });
    }
  }
}

export const reportsController = new ReportsController();
