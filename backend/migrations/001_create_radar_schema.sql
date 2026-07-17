-- Radar Google Ads: migração inicial (somente criação).
-- Não execute em produção sem configurar a conexão PostgreSQL do ambiente.

BEGIN;

CREATE SCHEMA IF NOT EXISTS radar;

CREATE TABLE radar.search_runs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_name VARCHAR(120) NOT NULL,
    region_name VARCHAR(160) NOT NULL,
    device VARCHAR(10) NOT NULL CHECK (device IN ('mobile', 'desktop')),
    keyword VARCHAR(255),
    provider VARCHAR(40) NOT NULL DEFAULT 'serpapi',
    provider_search_id VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    ads_found INTEGER NOT NULL DEFAULT 0 CHECK (ads_found >= 0),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE TABLE radar.advertisers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_name VARCHAR(255),
    domain VARCHAR(255) NOT NULL UNIQUE,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE radar.landing_pages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    canonical_url TEXT NOT NULL UNIQUE,
    domain VARCHAR(255) NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE radar.ad_observations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    search_run_id BIGINT NOT NULL REFERENCES radar.search_runs(id),
    advertiser_id BIGINT NOT NULL REFERENCES radar.advertisers(id),
    landing_page_id BIGINT REFERENCES radar.landing_pages(id),
    fingerprint CHAR(64) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    position_block VARCHAR(20) NOT NULL DEFAULT 'unknown'
        CHECK (position_block IN ('top', 'middle', 'bottom', 'unknown')),
    position_index SMALLINT CHECK (position_index > 0),
    displayed_url TEXT,
    target_url TEXT NOT NULL,
    phone VARCHAR(60),
    sitelinks JSONB NOT NULL DEFAULT '[]'::jsonb,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT ad_observations_search_fingerprint_unique
        UNIQUE (search_run_id, fingerprint)
);

CREATE TABLE radar.landing_page_snapshots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    landing_page_id BIGINT NOT NULL REFERENCES radar.landing_pages(id),
    ad_observation_id BIGINT REFERENCES radar.ad_observations(id),
    capture_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (capture_status IN ('pending', 'captured', 'failed', 'unavailable')),
    original_url TEXT NOT NULL,
    final_url TEXT,
    http_status SMALLINT CHECK (http_status BETWEEN 100 AND 599),
    page_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    h1 TEXT,
    headline TEXT,
    subtitle TEXT,
    primary_cta TEXT,
    whatsapp_url TEXT,
    form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    faq_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    social_proof JSONB NOT NULL DEFAULT '[]'::jsonb,
    urgency_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    authority_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    screenshot_path TEXT,
    html_path TEXT,
    content_hash CHAR(64),
    dom_hash CHAR(64),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT
);

CREATE TABLE radar.provider_usage_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    search_run_id BIGINT REFERENCES radar.search_runs(id),
    provider VARCHAR(40) NOT NULL DEFAULT 'serpapi',
    credits_consumed SMALLINT NOT NULL DEFAULT 0 CHECK (credits_consumed >= 0),
    monthly_limit INTEGER,
    remaining_credits INTEGER,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX search_runs_requested_at_idx
    ON radar.search_runs (requested_at DESC);

CREATE INDEX ad_observations_search_run_idx
    ON radar.ad_observations (search_run_id, observed_at DESC);

CREATE INDEX ad_observations_advertiser_idx
    ON radar.ad_observations (advertiser_id, observed_at DESC);

CREATE INDEX landing_page_snapshots_page_idx
    ON radar.landing_page_snapshots (landing_page_id, captured_at DESC);

CREATE INDEX provider_usage_events_recorded_at_idx
    ON radar.provider_usage_events (recorded_at DESC);

COMMIT;
