import { Request, Response } from 'express';
import { searchService } from '../services/search.service.js';

export class SearchController {
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query.q as string | undefined;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(200).json({
          success: true,
          data: [],
          total: 0,
          message: 'Empty query',
        });
        return;
      }

      const queryText = q.trim();

      // Optional lat / lng
      let lat: number | undefined;
      let lng: number | undefined;

      if (req.query.lat !== undefined && req.query.lng !== undefined) {
        const parsedLat = parseFloat(req.query.lat as string);
        const parsedLng = parseFloat(req.query.lng as string);

        if (
          !isNaN(parsedLat) &&
          !isNaN(parsedLng) &&
          parsedLat >= -90 &&
          parsedLat <= 90 &&
          parsedLng >= -180 &&
          parsedLng <= 180
        ) {
          lat = parsedLat;
          lng = parsedLng;
        }
      }

      // Optional radius
      let radiusMeters: number | undefined;
      if (req.query.radius !== undefined) {
        const parsedRadius = parseFloat(req.query.radius as string);
        if (!isNaN(parsedRadius) && parsedRadius > 0 && parsedRadius <= 50000) {
          radiusMeters = parsedRadius;
        }
      }

      // Limit (default 20, max 50)
      let limit = 20;
      if (req.query.limit !== undefined) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = Math.min(parsedLimit, 50);
        }
      }

      const results = await searchService.search({
        queryText,
        lat,
        lng,
        radiusMeters,
        limit,
      });

      res.status(200).json({
        success: true,
        data: results,
        total: results.length,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: err.message || 'An unexpected error occurred during search.',
        },
      });
    }
  }
}
