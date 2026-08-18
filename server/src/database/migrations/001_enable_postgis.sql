-- Migration 001: Enable PostGIS Extension
-- SRID: 4326 (WGS 84)

CREATE EXTENSION IF NOT EXISTS postgis;
