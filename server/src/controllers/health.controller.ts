import { Request, Response } from 'express';
import { HealthService } from '../services/health.service.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const health = await HealthService.getHealthStatus();
  const statusCode = health.status === 'error' ? 503 : 200;
  res.status(statusCode).json(health);
}
