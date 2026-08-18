import { Request, Response } from 'express';
import { placeRepository } from '../repositories/place.repository.js';
import { ApiResponse } from '../types/index.js';

export async function getPlaces(_req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const places = await placeRepository.findAllActive();
    res.json({
      success: true,
      data: places,
      count: places.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch places';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}

export async function searchPlaces(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      res
        .status(400)
        .json({ success: false, error: { message: 'Query parameter "q" is required.' } });
      return;
    }

    const places = await placeRepository.search(q.trim());
    res.json({
      success: true,
      data: places,
      count: places.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to search places';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}

export async function getNearbyPlaces(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 2000;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid latitude. Must be between -90 and 90.' },
      });
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid longitude. Must be between -180 and 180.' },
      });
      return;
    }

    if (isNaN(radius) || radius <= 0 || radius > 20000) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid radius. Must be between 1 and 20,000 meters.' },
      });
      return;
    }

    const places = await placeRepository.findNearby(lat, lng, radius);

    res.json({
      success: true,
      data: places,
      count: places.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch nearby places';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}
