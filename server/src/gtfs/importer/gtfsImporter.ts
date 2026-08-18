import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDatabasePool } from '../../database/index.js';
import { FeedValidator } from '../validators/feedValidator.js';
import { EntityNormalizer } from '../normalizer/entityNormalizer.js';
import { ModeMapper, SourceModeMappingConfig } from '../normalizer/modeMapper.js';
import { BatchInserter } from './batchInserter.js';
import { ImportReporter } from '../reporting/importReporter.js';
import { ImportReport } from '../types/report.types.js';
import { logger } from '../../utils/logger.js';

export interface ImportOptions {
  feedDir: string;
  sourceName?: string;
  provider?: string;
  version?: string;
  force?: boolean;
  mappingConfig?: SourceModeMappingConfig;
}

export class GtfsImporter {
  public static async importFeed(options: ImportOptions): Promise<ImportReport> {
    const startTime = Date.now();
    const feedDir = path.resolve(options.feedDir);
    const sourceName = options.sourceName || path.basename(feedDir);
    const version = options.version || new Date().toISOString().split('T')[0] || '1.0.0';

    logger.info(`🚀 Starting GTFS Ingestion Pipeline for "${sourceName}" (version: ${version})...`);

    // 1. Calculate Feed Hash
    const fileHash = this.computeFeedHash(feedDir);

    // 2. Validate Feed Structure & References
    const { feed, validation } = await FeedValidator.loadAndValidateFeed(feedDir);

    if (!validation.isValid || !feed) {
      logger.error(`❌ GTFS validation failed with ${validation.errorCount} error(s).`);
      const failureReport: ImportReport = {
        sourceName,
        datasetVersion: version,
        fileHash,
        status: 'FAILED',
        importedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        recordCounts: feed?.recordCounts ?? {
          agencies: 0,
          routes: 0,
          stops: 0,
          trips: 0,
          stop_times: 0,
          shapes: 0,
          services: 0,
        },
        errorCount: validation.errorCount,
        warningCount: validation.warningCount,
        issues: validation.issues,
      };

      ImportReporter.printConsoleSummary(failureReport);
      return failureReport;
    }

    const pool = getDatabasePool();
    if (!pool) {
      throw new Error('Database pool not initialized. Cannot import feed.');
    }

    const client = await pool.connect();
    const sourceId = `src-${this.generateHash(sourceName)}`;
    const datasetId = `ds-${this.generateHash(`${sourceId}:${version}:${fileHash.substring(0, 8)}`)}`;

    try {
      // Check duplicate dataset by hash
      const existingDataset = await client.query<{ status: string }>(
        'SELECT status FROM transit_datasets WHERE file_hash = $1 AND status = $2;',
        [fileHash, 'imported']
      );

      if (existingDataset.rows.length > 0 && !options.force) {
        logger.info(
          `ℹ️  Dataset with hash "${fileHash.substring(0, 16)}..." was already imported.`
        );
        const duplicateReport: ImportReport = {
          sourceName,
          datasetVersion: version,
          fileHash,
          status: 'VALIDATED',
          importedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          recordCounts: feed.recordCounts,
          errorCount: 0,
          warningCount: validation.warningCount,
          issues: validation.issues,
        };
        ImportReporter.printConsoleSummary(duplicateReport);
        return duplicateReport;
      }

      await client.query('BEGIN;');

      // 3. Register Transit Source
      await client.query(
        `INSERT INTO transit_sources (id, name, provider, source_type, description, is_active)
         VALUES ($1, $2, $3, 'gtfs', $4, true)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP;`,
        [sourceId, sourceName, options.provider || 'GTFS Provider', `GTFS Feed: ${sourceName}`]
      );

      // 4. Register Transit Dataset Version
      await client.query(
        `INSERT INTO transit_datasets (id, source_id, version, status, file_hash, record_counts, error_count, warning_count)
         VALUES ($1, $2, $3, 'importing', $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET status = 'importing';`,
        [
          datasetId,
          sourceId,
          version,
          fileHash,
          JSON.stringify(feed.recordCounts),
          validation.errorCount,
          validation.warningCount,
        ]
      );

      // 5. Normalization
      const modeMapper = new ModeMapper(options.mappingConfig);
      const normalizer = new EntityNormalizer(sourceId, datasetId, modeMapper);

      // Agencies
      const normAgencies = feed.agencies.map((a) => normalizer.normalizeAgency(a));
      const agencyIdMap = new Map<string, string>();
      for (const a of normAgencies) {
        agencyIdMap.set(a.external_id, a.id);
        await client.query(
          `INSERT INTO agencies (id, source_id, dataset_id, external_id, name, code, website, phone, email)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, website = EXCLUDED.website;`,
          [
            a.id,
            a.source_id,
            a.dataset_id,
            a.external_id,
            a.name,
            a.code,
            a.website,
            a.phone,
            a.email,
          ]
        );
      }

      // Services (Calendar)
      const normServices = feed.calendar.map((c) => normalizer.normalizeService(c));
      const serviceIdMap = new Map<string, string>();
      for (const s of normServices) {
        serviceIdMap.set(s.code, s.id);
        await client.query(
          `INSERT INTO services (id, code, name, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
          [
            s.id,
            s.code,
            s.name,
            s.monday,
            s.tuesday,
            s.wednesday,
            s.thursday,
            s.friday,
            s.saturday,
            s.sunday,
            s.start_date,
            s.end_date,
          ]
        );
      }

      // Routes & Route Variants
      const normRoutes = feed.routes.map((r) => {
        const agencyExtId =
          r.agency_id?.trim() ||
          feed.agencies[0]?.agency_id?.trim() ||
          feed.agencies[0]?.agency_name?.trim() ||
          '';
        const agencyId = agencyIdMap.get(agencyExtId) || null;
        return normalizer.normalizeRoute(r, agencyId);
      });

      const routeIdMap = new Map<string, string>();
      for (const r of normRoutes) {
        routeIdMap.set(r.external_id, r.id);
        await client.query(
          `INSERT INTO routes (id, source_id, dataset_id, external_id, agency_id, mode_id, code, name, description, route_color, is_active, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 'gtfs')
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, route_color = EXCLUDED.route_color;`,
          [
            r.id,
            r.source_id,
            r.dataset_id,
            r.external_id,
            r.agency_id,
            r.mode_id,
            r.code,
            r.name,
            r.description,
            r.route_color,
          ]
        );
      }

      // Build Route Variants from Trips
      const variantMap = new Map<string, string>(); // key: route_id:dir -> variant_id
      for (const t of feed.trips) {
        const routeId = routeIdMap.get(t.route_id.trim());
        if (!routeId) continue;
        const normRoute = normRoutes.find((r) => r.id === routeId);
        if (!normRoute) continue;

        const dir = t.direction_id === '1' ? 'inbound' : 'outbound';
        const vKey = `${routeId}:${dir}`;
        if (!variantMap.has(vKey)) {
          const normVariant = normalizer.normalizeRouteVariant(
            normRoute,
            t.direction_id,
            t.trip_headsign
          );
          variantMap.set(vKey, normVariant.id);
          await client.query(
            `INSERT INTO route_variants (id, dataset_id, external_id, route_id, name, direction, description, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
            [
              normVariant.id,
              normVariant.dataset_id,
              normVariant.external_id,
              normVariant.route_id,
              normVariant.name,
              normVariant.direction,
              normVariant.description,
            ]
          );
        }
      }

      // Stops (with PostGIS Point Geography)
      const normStops = feed.stops.map((s) => normalizer.normalizeStop(s));
      const stopIdMap = new Map<string, string>();
      for (const s of normStops) {
        stopIdMap.set(s.external_id, s.id);
        await client.query(
          `INSERT INTO stops (id, source_id, dataset_id, external_id, code, name, description, latitude, longitude, location, is_active, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ST_SetSRID(ST_MakePoint($9, $8), 4326)::geography, true, 'gtfs')
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name, 
             latitude = EXCLUDED.latitude, 
             longitude = EXCLUDED.longitude, 
             location = EXCLUDED.location;`,
          [
            s.id,
            s.source_id,
            s.dataset_id,
            s.external_id,
            s.code,
            s.name,
            s.description,
            s.latitude,
            s.longitude,
          ]
        );
      }

      // Shapes (PostGIS LineString)
      const shapePointsMap = new Map<string, { lat: number; lon: number; seq: number }[]>();
      for (const pt of feed.shapes) {
        const sId = pt.shape_id.trim();
        if (!shapePointsMap.has(sId)) {
          shapePointsMap.set(sId, []);
        }
        shapePointsMap.get(sId)!.push({
          lat: parseFloat(pt.shape_pt_lat),
          lon: parseFloat(pt.shape_pt_lon),
          seq: parseInt(pt.shape_pt_sequence, 10),
        });
      }

      const shapeIdToVariantMap = new Map<string, string>();
      for (const t of feed.trips) {
        if (t.shape_id && t.route_id) {
          const rId = routeIdMap.get(t.route_id.trim());
          const dir = t.direction_id === '1' ? 'inbound' : 'outbound';
          const varId = variantMap.get(`${rId}:${dir}`);
          if (varId) {
            shapeIdToVariantMap.set(t.shape_id.trim(), varId);
          }
        }
      }

      for (const [shapeId, pts] of shapePointsMap.entries()) {
        const sortedPts = pts.sort((a, b) => a.seq - b.seq);
        if (sortedPts.length >= 2) {
          const lineWkt = `LINESTRING(${sortedPts.map((p) => `${p.lon} ${p.lat}`).join(', ')})`;
          const varId = shapeIdToVariantMap.get(shapeId) || Array.from(variantMap.values())[0]!;
          const sDbId = `shape-${this.generateHash(`${datasetId}:${shapeId}`)}`;

          await client.query(
            `INSERT INTO shapes (id, dataset_id, external_id, route_variant_id, shape, source)
             VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326), 'gtfs')
             ON CONFLICT (id) DO UPDATE SET shape = EXCLUDED.shape;`,
            [sDbId, datasetId, shapeId, varId, lineWkt]
          );
        }
      }

      // Trips
      const normTrips: ReturnType<typeof normalizer.normalizeTrip>[] = [];
      const tripIdMap = new Map<string, string>();
      for (const t of feed.trips) {
        const rId = routeIdMap.get(t.route_id.trim());
        const dir = t.direction_id === '1' ? 'inbound' : 'outbound';
        const varId = variantMap.get(`${rId}:${dir}`) || Array.from(variantMap.values())[0]!;
        const serviceId = serviceIdMap.get(t.service_id.trim()) || null;
        const normTrip = normalizer.normalizeTrip(t, varId, serviceId);
        normTrips.push(normTrip);
        tripIdMap.set(normTrip.external_id, normTrip.id);

        await client.query(
          `INSERT INTO trips (id, dataset_id, external_id, route_variant_id, service_id, code, headsign, direction, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
           ON CONFLICT (id) DO UPDATE SET headsign = EXCLUDED.headsign;`,
          [
            normTrip.id,
            normTrip.dataset_id,
            normTrip.external_id,
            normTrip.route_variant_id,
            normTrip.service_id,
            normTrip.code,
            normTrip.headsign,
            normTrip.direction,
          ]
        );
      }

      // Stop Times (Batched)
      const normStopTimes = feed.stopTimes
        .map((st) => {
          const tripId = tripIdMap.get(st.trip_id.trim());
          const stopId = stopIdMap.get(st.stop_id.trim());
          if (!tripId || !stopId) return null;
          return normalizer.normalizeStopTime(st, tripId, stopId);
        })
        .filter((st): st is NonNullable<typeof st> => st !== null);

      await BatchInserter.insertBatch(
        client,
        'stop_times',
        ['id', 'trip_id', 'stop_id', 'stop_sequence', 'arrival_time', 'departure_time'],
        normStopTimes as unknown as Record<string, unknown>[],
        500
      );

      // 6. Update Dataset status to imported
      await client.query(
        `UPDATE transit_datasets 
         SET status = 'imported', imported_at = CURRENT_TIMESTAMP 
         WHERE id = $1;`,
        [datasetId]
      );

      await client.query('COMMIT;');

      const durationMs = Date.now() - startTime;
      logger.info(`🎉 GTFS Ingestion complete in ${durationMs}ms!`);

      const report: ImportReport = {
        sourceName,
        datasetVersion: version,
        fileHash,
        status: 'IMPORTED',
        importedAt: new Date().toISOString(),
        durationMs,
        recordCounts: feed.recordCounts,
        errorCount: 0,
        warningCount: validation.warningCount,
        issues: validation.issues,
      };

      // Save report
      const reportsDir = path.resolve(process.cwd(), 'server/data/reports');
      ImportReporter.saveReportFiles(report, reportsDir);
      ImportReporter.printConsoleSummary(report);

      return report;
    } catch (error) {
      await client.query('ROLLBACK;');
      const msg = error instanceof Error ? error.message : 'Unknown error during ingestion';
      logger.error(`❌ Ingestion failed. Transaction rolled back cleanly: ${msg}`);

      const rollbackReport: ImportReport = {
        sourceName,
        datasetVersion: version,
        fileHash,
        status: 'ROLLED_BACK',
        importedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        recordCounts: feed.recordCounts,
        errorCount: 1,
        warningCount: validation.warningCount,
        issues: [{ file: 'database', message: msg, severity: 'ERROR' }, ...validation.issues],
      };

      ImportReporter.printConsoleSummary(rollbackReport);
      return rollbackReport;
    } finally {
      client.release();
    }
  }

  private static computeFeedHash(feedDir: string): string {
    const files = fs
      .readdirSync(feedDir)
      .filter((f) => f.endsWith('.txt'))
      .sort();
    const hash = crypto.createHash('sha256');
    for (const file of files) {
      const content = fs.readFileSync(path.join(feedDir, file));
      hash.update(file);
      hash.update(content);
    }
    return hash.digest('hex');
  }

  private static generateHash(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}
