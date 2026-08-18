import { RawGtfsShape } from '../types/gtfs.types.js';
import { ValidationIssue } from '../types/report.types.js';

export function validateShapes(shapes: RawGtfsShape[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const shapePoints = new Map<string, { lat: number; lon: number; seq: number }[]>();

  shapes.forEach((pt, index) => {
    const line = index + 2;
    const shapeId = pt.shape_id?.trim();
    const lat = parseFloat(pt.shape_pt_lat);
    const lon = parseFloat(pt.shape_pt_lon);
    const seq = parseInt(pt.shape_pt_sequence, 10);

    if (!shapeId) {
      issues.push({
        file: 'shapes.txt',
        line,
        field: 'shape_id',
        message: 'Missing shape_id in shapes.txt.',
        severity: 'ERROR',
      });
      return;
    }

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      issues.push({
        file: 'shapes.txt',
        line,
        field: 'coordinates',
        message: `Shape "${shapeId}" has invalid coordinate (${pt.shape_pt_lat}, ${pt.shape_pt_lon}).`,
        severity: 'ERROR',
        entityId: shapeId,
      });
      return;
    }

    if (isNaN(seq)) {
      issues.push({
        file: 'shapes.txt',
        line,
        field: 'shape_pt_sequence',
        message: `Shape "${shapeId}" has invalid shape_pt_sequence "${pt.shape_pt_sequence}".`,
        severity: 'ERROR',
        entityId: shapeId,
      });
      return;
    }

    if (!shapePoints.has(shapeId)) {
      shapePoints.set(shapeId, []);
    }
    shapePoints.get(shapeId)!.push({ lat, lon, seq });
  });

  // Verify each shape has at least 2 points to form a LineString
  shapePoints.forEach((points, shapeId) => {
    if (points.length < 2) {
      issues.push({
        file: 'shapes.txt',
        message: `Shape "${shapeId}" has fewer than 2 valid points (${points.length}). Cannot construct LineString geometry.`,
        severity: 'ERROR',
        entityId: shapeId,
      });
    }
  });

  return issues;
}
