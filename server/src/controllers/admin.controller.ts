import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { adminService } from '../services/admin.service.js';

export class AdminController {
  async getMetrics(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const metrics = await adminService.getMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch admin metrics';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const statusFilter = req.query.status as string | undefined;
      const reports = await adminService.getAllReports(statusFilter);
      res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch reports for moderation';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async moderateReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action } = req.body || {};
      const success = await adminService.moderateReport(id!, action);
      res.status(200).json({ success, message: `Report ${action} action executed` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to moderate report';
      res.status(400).json({ success: false, error: msg });
    }
  }

  async getUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await adminService.getAllUsers();
      res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch user directory';
      res.status(500).json({ success: false, error: msg });
    }
  }

  async setUserAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isAdmin } = req.body || {};
      const success = await adminService.setAdminStatus(id!, isAdmin === true);
      res.status(200).json({ success });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update user admin status';
      res.status(400).json({ success: false, error: msg });
    }
  }
}

export const adminController = new AdminController();
