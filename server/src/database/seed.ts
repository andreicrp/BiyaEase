import { getDatabasePool, closeDatabasePool } from './index.js';
import { logger } from '../utils/logger.js';

export async function seedDatabase(): Promise<boolean> {
  const pool = getDatabasePool();
  if (!pool) {
    logger.error('❌ Cannot seed database: Database pool is not available. Check DATABASE_URL.');
    return false;
  }

  const client = await pool.connect();
  try {
    logger.info('[SEED] Starting Metro Manila transit seed data population...');
    await client.query('BEGIN;');

    // 1. Transit Modes
    logger.info('[SEED] Seeding transit modes...');
    const modes = [
      [
        'mode-jeepney',
        'jeepney',
        'Jeepney',
        'Traditional and modern Philippine jeepneys',
        'jeepney',
        '#F59E0B',
      ],
      [
        'mode-bus',
        'bus',
        'City Bus',
        'Metro Manila public city buses and EDSA Carousel',
        'bus',
        '#2563EB',
      ],
      ['mode-mrt', 'mrt', 'MRT', 'Metro Rail Transit lines (MRT-3)', 'mrt', '#7C3AED'],
      ['mode-lrt', 'lrt', 'LRT', 'Light Rail Transit lines (LRT-1, LRT-2)', 'lrt', '#DB2777'],
      [
        'mode-uv',
        'uv_express',
        'UV Express',
        'Utility Vehicle Express point-to-point and shared vans',
        'uv_express',
        '#0F766E',
      ],
      [
        'mode-tricycle',
        'tricycle',
        'Tricycle',
        'Local neighborhood and barangay tricycles',
        'tricycle',
        '#10B981',
      ],
      [
        'mode-walking',
        'walking',
        'Walking',
        'Pedestrian walking paths and footbridges',
        'walking',
        '#64748B',
      ],
    ];

    for (const [id, code, name, desc, icon, color] of modes) {
      await client.query(
        `INSERT INTO transit_modes (id, code, name, description, icon, color)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [id, code, name, desc, icon, color]
      );
    }

    // 2. Agencies
    logger.info('[SEED] Seeding transit agencies...');
    const agencies = [
      [
        'agency-ltfrb',
        'Land Transportation Franchising and Regulatory Board',
        'LTFRB',
        'National PUV regulatory board for buses and jeepneys',
        'https://ltfrb.gov.ph',
        '8529-7111',
        'pacd@ltfrb.gov.ph',
      ],
      [
        'agency-mrtc',
        'Metro Rail Transit Corporation',
        'MRTC',
        'Operator of MRT-3 Blue Line along EDSA',
        'https://dotrmrt3.gov.ph',
        '8929-5347',
        'feedback@dotrmrt3.gov.ph',
      ],
      [
        'agency-lrmc',
        'Light Rail Manila Corporation',
        'LRMC',
        'Operator of LRT-1 and LRT-2 rail corridors',
        'https://lrmc.ph',
        '8888-5762',
        'inquiry@lrmc.ph',
      ],
      [
        'agency-mmda',
        'Metro Manila Development Authority',
        'MMDA',
        'Manager of EDSA Busway Carousel and traffic corridors',
        'https://mmda.gov.ph',
        '136',
        'info@mmda.gov.ph',
      ],
      [
        'agency-up-trans',
        'UP Diliman Transport Cooperative',
        'UP_TRANS',
        'Campus jeepney operators and local routes',
        'https://upd.edu.ph',
        '8981-8500',
        'ovcsa@upd.edu.ph',
      ],
    ];

    for (const [id, name, code, desc, web, phone, email] of agencies) {
      await client.query(
        `INSERT INTO agencies (id, name, code, description, website, phone, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [id, name, code, desc, web, phone, email]
      );
    }

    // 3. Services (GTFS Calendar Schedules)
    logger.info('[SEED] Seeding operating services...');
    await client.query(
      `INSERT INTO services (id, code, name, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
       VALUES 
        ('service-daily', 'DAILY_REGULAR', 'Daily Regular Schedule', true, true, true, true, true, true, true, '2026-01-01', '2026-12-31'),
        ('service-weekday', 'WEEKDAY_REGULAR', 'Monday to Friday Schedule', true, true, true, true, true, false, false, '2026-01-01', '2026-12-31')
       ON CONFLICT (id) DO NOTHING;`
    );

    // 4. Routes
    logger.info('[SEED] Seeding routes...');
    const routes = [
      [
        'route-jeep-05',
        'agency-up-trans',
        'mode-jeepney',
        'JEEP-05',
        'UP Campus - Philcoa',
        'Traditional Jeepney via Commonwealth Ave & UP Oval',
        '#F59E0B',
      ],
      [
        'route-mrt-3',
        'agency-mrtc',
        'mode-mrt',
        'MRT-3',
        'MRT-3 Blue Line',
        'Mass Rapid Transit from North Avenue to Taft Avenue along EDSA',
        '#7C3AED',
      ],
      [
        'route-lrt-2',
        'agency-lrmc',
        'mode-lrt',
        'LRT-2',
        'LRT-2 Purple Line',
        'Light Rail Transit from Recto (Manila) to Antipolo (Rizal)',
        '#DB2777',
      ],
      [
        'route-bus-edsa',
        'agency-mmda',
        'mode-bus',
        'BUS-EDSA',
        'EDSA Busway Carousel',
        'Dedicated median bus rapid transit along EDSA',
        '#2563EB',
      ],
      [
        'route-uv-fairview',
        'agency-ltfrb',
        'mode-uv',
        'UV-FAIRVIEW',
        'Fairview - Buendia',
        'UV Express van via Quezon Avenue & España',
        '#0F766E',
      ],
    ];

    for (const [id, agencyId, modeId, code, name, desc, color] of routes) {
      await client.query(
        `INSERT INTO routes (id, agency_id, mode_id, code, name, description, route_color, is_active, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'biyaease_seed')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [id, agencyId, modeId, code, name, desc, color]
      );
    }

    // 5. Route Variants
    logger.info('[SEED] Seeding route variants...');
    const variants = [
      [
        'var-jeep-05-out',
        'route-jeep-05',
        'UP Campus to Philcoa',
        'outbound',
        'Departs UP Oval passing Vinzons Hall towards Philcoa',
      ],
      [
        'var-jeep-05-in',
        'route-jeep-05',
        'Philcoa to UP Campus',
        'inbound',
        'Departs Philcoa terminal entering UP via University Ave',
      ],
      [
        'var-mrt-3-south',
        'route-mrt-3',
        'North Ave to Taft Ave',
        'southbound',
        'Southbound train along EDSA towards Pasay',
      ],
      [
        'var-mrt-3-north',
        'route-mrt-3',
        'Taft Ave to North Ave',
        'northbound',
        'Northbound train along EDSA towards Quezon City',
      ],
      [
        'var-lrt-2-east',
        'route-lrt-2',
        'Recto to Antipolo',
        'eastbound',
        'Eastbound train passing Cubao and Katipunan towards Antipolo',
      ],
      [
        'var-bus-edsa-south',
        'route-bus-edsa',
        'Monumento to PITX',
        'southbound',
        'EDSA Busway southbound corridor',
      ],
    ];

    for (const [id, routeId, name, dir, desc] of variants) {
      await client.query(
        `INSERT INTO route_variants (id, route_id, name, direction, description, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, direction = EXCLUDED.direction;`,
        [id, routeId, name, dir, desc]
      );
    }

    // 6. Transit Stops (with PostGIS Point Geography)
    logger.info('[SEED] Seeding physical transit stops with PostGIS coordinates...');
    const stops = [
      [
        'stop-up-oval',
        'STP-UP-01',
        'UP Diliman Academic Oval',
        'Near Quezon Hall & sunken garden',
        'Academic Oval, Diliman, Quezon City',
        14.6538,
        121.0685,
      ],
      [
        'stop-up-vinzons',
        'STP-UP-02',
        'UP Vinzons Hall / Katipunan Gate',
        'Vinzons Hall jeepney waiting shed',
        'Katipunan Ave, Diliman, Quezon City',
        14.6519,
        121.0718,
      ],
      [
        'stop-philcoa',
        'STP-QC-01',
        'Philcoa PUV Terminal',
        'Major transfer hub for jeepneys and UV Express',
        'Commonwealth Ave cor Masaya St, Quezon City',
        14.6536,
        121.0531,
      ],
      [
        'stop-mrt-north',
        'MRT3-01',
        'North Avenue MRT-3 Station',
        'Terminal station near Trinoma & SM North',
        'EDSA cor North Ave, Quezon City',
        14.6532,
        121.0322,
      ],
      [
        'stop-mrt-qave',
        'MRT3-02',
        'Quezon Avenue MRT-3 Station',
        'Station connected to Centris Walk',
        'EDSA cor Quezon Ave, Quezon City',
        14.6429,
        121.0384,
      ],
      [
        'stop-mrt-kamuning',
        'MRT3-03',
        'GMA-Kamuning MRT-3 Station',
        'Station near Timog & GMA Network Center',
        'EDSA cor Timog Ave, Quezon City',
        14.6353,
        121.0433,
      ],
      [
        'stop-mrt-cubao',
        'MRT3-04',
        'Araneta Center-Cubao MRT-3 Station',
        'Major transfer station with LRT-2',
        'EDSA cor Aurora Blvd, Cubao, Quezon City',
        14.6196,
        121.0511,
      ],
      [
        'stop-mrt-shaw',
        'MRT3-07',
        'Shaw Boulevard MRT-3 Station',
        'Central business stop connected to Shangri-La & Megamall',
        'EDSA cor Shaw Blvd, Mandaluyong',
        14.5811,
        121.0536,
      ],
      [
        'stop-mrt-ayala',
        'MRT3-11',
        'Ayala MRT-3 Station',
        'Makati Central Business District station',
        'EDSA cor Ayala Ave, Makati',
        14.5492,
        121.028,
      ],
      [
        'stop-mrt-taft',
        'MRT3-13',
        'Taft Avenue MRT-3 Station',
        'Terminal station connected to LRT-1 EDSA',
        'EDSA cor Taft Ave, Pasay',
        14.5377,
        121.0014,
      ],
      [
        'stop-lrt-recto',
        'LRT2-01',
        'Recto LRT-2 Station',
        'West terminal near university belt',
        'Claro M. Recto Ave, Manila',
        14.6035,
        120.984,
      ],
      [
        'stop-lrt-cubao',
        'LRT2-08',
        'Araneta Center-Cubao LRT-2 Station',
        'Transfer station with MRT-3',
        'Aurora Blvd cor Gateway Mall, Cubao, QC',
        14.6225,
        121.0532,
      ],
      [
        'stop-lrt-katipunan',
        'LRT2-10',
        'Katipunan LRT-2 Station',
        'Subway-level station near Ateneo & Miriam',
        'Aurora Blvd cor Katipunan Ave, QC',
        14.6315,
        121.0735,
      ],
      [
        'stop-bus-smnorth',
        'BUS-01',
        'SM North EDSA Busway Stop',
        'Median busway platform',
        'EDSA Northbound, Quezon City',
        14.6569,
        121.0283,
      ],
      [
        'stop-bus-trinoma',
        'BUS-02',
        'Trinoma EDSA Carousel Stop',
        'Median busway pedestrian bridge access',
        'EDSA cor North Ave, Quezon City',
        14.6515,
        121.0335,
      ],
    ];

    for (const [id, code, name, desc, addr, lat, lng] of stops) {
      await client.query(
        `INSERT INTO stops (id, code, name, description, address, latitude, longitude, location, is_active, source)
         VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography,
           true, 'biyaease_seed'
         )
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, 
           latitude = EXCLUDED.latitude, 
           longitude = EXCLUDED.longitude, 
           location = EXCLUDED.location;`,
        [id, code, name, desc, addr, lat, lng]
      );
    }

    // 7. Trips
    logger.info('[SEED] Seeding trips...');
    const trips = [
      [
        'trip-jeep-05-1',
        'var-jeep-05-out',
        'service-daily',
        'TRP-JEEP-05-01',
        'Philcoa via UP Oval',
        'outbound',
      ],
      [
        'trip-mrt-3-1',
        'var-mrt-3-south',
        'service-daily',
        'TRP-MRT-3-01',
        'Taft Avenue via EDSA',
        'southbound',
      ],
      [
        'trip-lrt-2-1',
        'var-lrt-2-east',
        'service-daily',
        'TRP-LRT-2-01',
        'Antipolo via Cubao',
        'eastbound',
      ],
    ];

    for (const [id, varId, serviceId, code, headsign, dir] of trips) {
      await client.query(
        `INSERT INTO trips (id, route_variant_id, service_id, code, headsign, direction, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (id) DO UPDATE SET headsign = EXCLUDED.headsign;`,
        [id, varId, serviceId, code, headsign, dir]
      );
    }

    // 8. Stop Times (Sequenced Transit Connections)
    logger.info('[SEED] Seeding stop times...');
    const stopTimes = [
      // Jeepney 05 Sequence
      ['st-j05-1', 'trip-jeep-05-1', 'stop-up-oval', 1, '06:00:00', '06:02:00'],
      ['st-j05-2', 'trip-jeep-05-1', 'stop-up-vinzons', 2, '06:07:00', '06:08:00'],
      ['st-j05-3', 'trip-jeep-05-1', 'stop-philcoa', 3, '06:18:00', '06:20:00'],

      // MRT-3 Sequence
      ['st-mrt-1', 'trip-mrt-3-1', 'stop-mrt-north', 1, '05:30:00', '05:31:00'],
      ['st-mrt-2', 'trip-mrt-3-1', 'stop-mrt-qave', 2, '05:34:00', '05:35:00'],
      ['st-mrt-3', 'trip-mrt-3-1', 'stop-mrt-kamuning', 3, '05:38:00', '05:39:00'],
      ['st-mrt-4', 'trip-mrt-3-1', 'stop-mrt-cubao', 4, '05:43:00', '05:44:00'],
      ['st-mrt-5', 'trip-mrt-3-1', 'stop-mrt-shaw', 5, '05:51:00', '05:52:00'],
      ['st-mrt-6', 'trip-mrt-3-1', 'stop-mrt-ayala', 6, '06:01:00', '06:02:00'],
      ['st-mrt-7', 'trip-mrt-3-1', 'stop-mrt-taft', 7, '06:08:00', '06:09:00'],
    ];

    for (const [id, tripId, stopId, seq, arr, dep] of stopTimes) {
      await client.query(
        `INSERT INTO stop_times (id, trip_id, stop_id, stop_sequence, arrival_time, departure_time)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (trip_id, stop_sequence) DO UPDATE SET arrival_time = EXCLUDED.arrival_time;`,
        [id, tripId, stopId, seq, arr, dep]
      );
    }

    // 9. Route Shapes (PostGIS LineString Geometry)
    logger.info('[SEED] Seeding route shapes with PostGIS LineString geometry...');
    const shapes = [
      [
        'shape-jeep-05-out',
        'var-jeep-05-out',
        'LINESTRING(121.0685 14.6538, 121.0718 14.6519, 121.0650 14.6550, 121.0580 14.6540, 121.0531 14.6536)',
        2800,
      ],
      [
        'shape-mrt-3-south',
        'var-mrt-3-south',
        'LINESTRING(121.0322 14.6532, 121.0384 14.6429, 121.0433 14.6353, 121.0511 14.6196, 121.0536 14.5811, 121.0280 14.5492, 121.0014 14.5377)',
        16900,
      ],
    ];

    for (const [id, varId, lineWkt, dist] of shapes) {
      await client.query(
        `INSERT INTO shapes (id, route_variant_id, shape, total_distance_meters, source)
         VALUES (
           $1, $2,
           ST_GeomFromText($3, 4326),
           $4, 'biyaease_seed'
         )
         ON CONFLICT (id) DO UPDATE SET shape = EXCLUDED.shape;`,
        [id, varId, lineWkt, dist]
      );
    }

    // 10. Searchable Places & Landmarks (PostGIS Point Geography)
    logger.info('[SEED] Seeding searchable places and landmarks...');
    const places = [
      [
        'place-sm-north',
        'SM North EDSA',
        'mall',
        'North Ave cor EDSA, Bago Bantay, Quezon City',
        14.6565,
        121.0288,
        'google-sm-north',
      ],
      [
        'place-up-diliman',
        'University of the Philippines Diliman',
        'university',
        'Diliman, Quezon City',
        14.6538,
        121.0685,
        'osm-up-diliman',
      ],
      [
        'place-trinoma',
        'Trinoma Mall',
        'mall',
        'EDSA cor North Ave, Quezon City',
        14.6515,
        121.0335,
        'google-trinoma',
      ],
      [
        'place-cubao-gateway',
        'Gateway Mall / Araneta City',
        'mall',
        'General Aguinaldo Ave, Cubao, Quezon City',
        14.6219,
        121.0526,
        'google-gateway',
      ],
      [
        'place-qmc',
        'Quezon Memorial Circle',
        'landmark',
        'Elliptical Road, Diliman, Quezon City',
        14.6517,
        121.0494,
        'osm-qmc',
      ],
      [
        'place-bgc-highstreet',
        'Bonifacio High Street',
        'commercial',
        '5th Ave, Bonifacio Global City, Taguig',
        14.5513,
        121.0505,
        'google-bgc',
      ],
      [
        'place-manila-cityhall',
        'Manila City Hall',
        'government',
        'Padre Burgos Ave, Ermita, Manila',
        14.5896,
        120.9818,
        'osm-manila-ch',
      ],
    ];

    for (const [id, name, cat, addr, lat, lng, extId] of places) {
      await client.query(
        `INSERT INTO places (id, name, category, address, latitude, longitude, location, source, external_id, is_active)
         VALUES (
           $1, $2, $3, $4, $5, $6,
           ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography,
           'biyaease_seed', $7, true
         )
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, 
           category = EXCLUDED.category, 
           latitude = EXCLUDED.latitude, 
           longitude = EXCLUDED.longitude, 
           location = EXCLUDED.location;`,
        [id, name, cat, addr, lat, lng, extId]
      );
    }

    // 11. Fares
    logger.info('[SEED] Seeding transit fare matrices (in Philippine Peso ₱)...');
    const fares = [
      ['fare-jeep-05', 'route-jeep-05', 'mode-jeepney', 13.0, 13.0, 1.8, 'PHP', 'regular'],
      ['fare-mrt-3', 'route-mrt-3', 'mode-mrt', 13.0, 13.0, 1.0, 'PHP', 'regular'],
      ['fare-lrt-2', 'route-lrt-2', 'mode-lrt', 15.0, 15.0, 1.2, 'PHP', 'regular'],
      ['fare-bus-edsa', 'route-bus-edsa', 'mode-bus', 15.0, 15.0, 2.2, 'PHP', 'regular'],
      ['fare-uv-fairview', 'route-uv-fairview', 'mode-uv', 25.0, 25.0, 2.5, 'PHP', 'regular'],
    ];

    for (const [id, routeId, modeId, baseFare, minFare, perKm, curr, fareType] of fares) {
      await client.query(
        `INSERT INTO fares (id, route_id, mode_id, base_fare, minimum_fare, per_km_rate, currency, fare_type, effective_from)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
         ON CONFLICT (id) DO UPDATE SET base_fare = EXCLUDED.base_fare, minimum_fare = EXCLUDED.minimum_fare;`,
        [id, routeId, modeId, baseFare, minFare, perKm, curr, fareType]
      );
    }

    await client.query('COMMIT;');
    logger.info('🎉 Database seeded successfully with realistic Metro Manila transit records!');
    return true;
  } catch (error) {
    await client.query('ROLLBACK;');
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Seeding failed: ${msg}`);
    return false;
  } finally {
    client.release();
  }
}

// Direct CLI execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(async (success) => {
      await closeDatabasePool();
      process.exit(success ? 0 : 1);
    })
    .catch(async (err) => {
      logger.error('Seed runner error:', err);
      await closeDatabasePool();
      process.exit(1);
    });
}
