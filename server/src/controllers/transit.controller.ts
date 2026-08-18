import { Request, Response } from 'express';
import { transitModeRepository } from '../repositories/transitMode.repository.js';
import { routeRepository } from '../repositories/route.repository.js';
import { stopRepository } from '../repositories/stop.repository.js';
import { ApiResponse } from '../types/index.js';

export async function getTransitModes(_req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const modes = await transitModeRepository.findAll();
    res.json({
      success: true,
      data: modes,
      count: modes.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch transit modes';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}

export async function getRoutes(_req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const routes = await routeRepository.findAllActive();
    res.json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch routes';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}

export async function getRouteById(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const route = await routeRepository.findById(req.params.id as string);
    if (!route) {
      res.status(404).json({ success: false, error: { message: 'Route not found' } });
      return;
    }

    const variants = await routeRepository.findVariants(route.id);

    res.json({
      success: true,
      data: {
        ...route,
        variants,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch route';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}

export async function getRouteStops(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const routeId = req.params.id as string;
    const variants = await routeRepository.findVariants(routeId);
    if (variants.length === 0) {
      res.status(404).json({ success: false, error: { message: 'No variants found for route' } });
      return;
    }

    const variantId = (req.query.variantId as string) || variants[0]?.id;
    if (!variantId) {
      res.status(404).json({ success: false, error: { message: 'Route variant not found' } });
      return;
    }

    const stops = await stopRepository.findByRouteVariantId(variantId);

    res.json({
      success: true,
      data: {
        routeId,
        variantId,
        stops,
      },
      count: stops.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch route stops';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}

export async function getRouteShape(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const routeId = req.params.id as string;
    const variants = await routeRepository.findVariants(routeId);
    if (variants.length === 0) {
      res.status(404).json({ success: false, error: { message: 'No variants found for route' } });
      return;
    }

    const variantId = (req.query.variantId as string) || variants[0]?.id;
    if (!variantId) {
      res.status(404).json({ success: false, error: { message: 'Route variant not found' } });
      return;
    }

    const shape = await routeRepository.findShapeGeoJson(variantId);
    if (!shape) {
      res
        .status(404)
        .json({ success: false, error: { message: 'Shape not found for route variant' } });
      return;
    }

    res.json({
      success: true,
      data: {
        ...shape,
        geometry: JSON.parse(shape.geojson),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch route shape';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}

export async function getNearbyStops(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 1000;

    // Strict validation
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

    if (isNaN(radius) || radius <= 0 || radius > 10000) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid radius. Must be between 1 and 10,000 meters.' },
      });
      return;
    }

    const stops = await stopRepository.findNearby(lat, lng, radius);

    res.json({
      success: true,
      data: stops,
      count: stops.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch nearby stops';
    res.status(500).json({ success: false, error: { message: msg } });
  }
}
