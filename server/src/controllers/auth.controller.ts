import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, displayName } = req.body || {};
      const result = await authService.register(email, password, displayName);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({
        success: false,
        error: msg,
      });
    }
  }

  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body || {};
      const result = await authService.login(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({
        success: false,
        error: msg,
      });
    }
  }

  async logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await authService.getCurrentUser(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User profile not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to retrieve profile';
      res.status(500).json({
        success: false,
        error: msg,
      });
    }
  }
}

export const authController = new AuthController();
