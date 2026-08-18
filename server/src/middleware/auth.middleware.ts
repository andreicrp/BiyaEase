import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const payload = authService.verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    displayName: payload.displayName,
  };

  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = authService.verifyToken(token);
    if (payload) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName,
      };
    }
  }

  next();
}
