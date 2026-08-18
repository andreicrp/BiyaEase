-- Migration 017: Enable pg_trgm and Add Trigram Search Indexes
-- Accelerates fast prefix, substring, and fuzzy similarity searches across places, stops, and routes

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Places trigram and category indexes
CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON places USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_places_address_trgm ON places USING GIN (address gin_trgm_ops);

-- Stops trigram indexes
CREATE INDEX IF NOT EXISTS idx_stops_name_trgm ON stops USING GIN (name gin_trgm_ops);

-- Routes trigram indexes
CREATE INDEX IF NOT EXISTS idx_routes_name_trgm ON routes USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_routes_code_trgm ON routes USING GIN (code gin_trgm_ops);
