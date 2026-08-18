import path from 'path';
import fs from 'fs';
import { parseCsvFile } from '../parser/csvParser.js';
import {
  RawGtfsAgency,
  RawGtfsRoute,
  RawGtfsStop,
  RawGtfsTrip,
  RawGtfsStopTime,
  RawGtfsCalendar,
  RawGtfsShape,
} from '../types/gtfs.types.js';
import { ValidationIssue, ValidationResult, FeedRecordCounts } from '../types/report.types.js';
import { validateAgencies } from './agencyValidator.js';
import { validateRoutes } from './routeValidator.js';
import { validateStops } from './stopValidator.js';
import { validateTrips } from './tripValidator.js';
import { validateStopTimes } from './stopTimeValidator.js';
import { validateCalendar } from './calendarValidator.js';
import { validateShapes } from './shapeValidator.js';

export interface LoadedGtfsFeed {
  feedPath: string;
  agencies: RawGtfsAgency[];
  routes: RawGtfsRoute[];
  stops: RawGtfsStop[];
  trips: RawGtfsTrip[];
  stopTimes: RawGtfsStopTime[];
  calendar: RawGtfsCalendar[];
  shapes: RawGtfsShape[];
  recordCounts: FeedRecordCounts;
}

export class FeedValidator {
  public static async loadAndValidateFeed(feedDir: string): Promise<{
    feed: LoadedGtfsFeed | null;
    validation: ValidationResult;
  }> {
    const issues: ValidationIssue[] = [];

    // Check directory existence
    if (!fs.existsSync(feedDir) || !fs.statSync(feedDir).isDirectory()) {
      return {
        feed: null,
        validation: {
          isValid: false,
          issues: [
            {
              file: 'feed',
              message: `Feed directory does not exist: ${feedDir}`,
              severity: 'ERROR',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      };
    }

    // Required files
    const requiredFiles = ['agency.txt', 'routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt'];
    for (const reqFile of requiredFiles) {
      if (!fs.existsSync(path.join(feedDir, reqFile))) {
        issues.push({
          file: reqFile,
          message: `Missing required GTFS file: ${reqFile}`,
          severity: 'ERROR',
        });
      }
    }

    // Parse core files
    const agencies = await parseCsvFile<RawGtfsAgency>(path.join(feedDir, 'agency.txt'));
    const routes = await parseCsvFile<RawGtfsRoute>(path.join(feedDir, 'routes.txt'));
    const stops = await parseCsvFile<RawGtfsStop>(path.join(feedDir, 'stops.txt'));
    const trips = await parseCsvFile<RawGtfsTrip>(path.join(feedDir, 'trips.txt'));
    const stopTimes = await parseCsvFile<RawGtfsStopTime>(path.join(feedDir, 'stop_times.txt'));
    const calendar = await parseCsvFile<RawGtfsCalendar>(path.join(feedDir, 'calendar.txt'));
    const shapes = await parseCsvFile<RawGtfsShape>(path.join(feedDir, 'shapes.txt'));

    // Validate Agency
    issues.push(...validateAgencies(agencies));
    const validAgencyIds = new Set(
      agencies.map((a) => a.agency_id?.trim() || a.agency_name.trim())
    );

    // Validate Routes
    issues.push(...validateRoutes(routes, validAgencyIds));
    const validRouteIds = new Set(routes.map((r) => r.route_id.trim()));

    // Validate Stops
    issues.push(...validateStops(stops));
    const validStopIds = new Set(stops.map((s) => s.stop_id.trim()));

    // Validate Calendar
    issues.push(...validateCalendar(calendar));
    const validServiceIds = new Set(calendar.map((c) => c.service_id.trim()));

    // Validate Shapes
    issues.push(...validateShapes(shapes));
    const validShapeIds = new Set(shapes.map((s) => s.shape_id.trim()));

    // Validate Trips
    issues.push(...validateTrips(trips, validRouteIds, validServiceIds, validShapeIds));
    const validTripIds = new Set(trips.map((t) => t.trip_id.trim()));

    // Validate Stop Times
    issues.push(...validateStopTimes(stopTimes, validTripIds, validStopIds));

    const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;

    const recordCounts: FeedRecordCounts = {
      agencies: agencies.length,
      routes: routes.length,
      stops: stops.length,
      trips: trips.length,
      stop_times: stopTimes.length,
      shapes: new Set(shapes.map((s) => s.shape_id)).size,
      services: calendar.length,
    };

    const feed: LoadedGtfsFeed = {
      feedPath: feedDir,
      agencies,
      routes,
      stops,
      trips,
      stopTimes,
      calendar,
      shapes,
      recordCounts,
    };

    return {
      feed,
      validation: {
        isValid: errorCount === 0,
        issues,
        errorCount,
        warningCount,
      },
    };
  }
}
