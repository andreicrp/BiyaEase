import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { RootApiResponse } from '../types/index.js';

export class RootController {
  public static getRoot(_req: Request, res: Response): void {
    const response: RootApiResponse = {
      name: 'BiyaEase API',
      version: '0.1.0',
      description: 'Philippine Public Transportation & Commute Navigation API',
      environment: env.NODE_ENV,
      docs: '/api/health',
    };
    res.status(200).json(response);
  }
}
