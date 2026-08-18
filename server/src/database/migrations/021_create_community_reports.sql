-- Migration 021: Create community_reports and report_confirmations tables
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    confirmed_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_confirmations (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_report_user_confirmation UNIQUE (report_id, user_id)
);

-- Spatial GIST index on location
CREATE INDEX IF NOT EXISTS idx_community_reports_location ON community_reports USING GIST(location);

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_expires_at ON community_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_community_reports_type ON community_reports(type);
CREATE INDEX IF NOT EXISTS idx_community_reports_user_id ON community_reports(user_id);
