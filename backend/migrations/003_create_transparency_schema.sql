-- Radar Google Ads: histórico incremental do Google Ads Transparency Center.
-- Migração não destrutiva: cria somente estruturas ausentes.

BEGIN;

CREATE SCHEMA IF NOT EXISTS radar;

CREATE TABLE IF NOT EXISTS radar.transparency_scans (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    advertiser_id BIGINT NOT NULL REFERENCES radar.advertisers(id),
    advertiser_query VARCHAR(255) NOT NULL,
    provider VARCHAR(40) NOT NULL DEFAULT 'serpapi',
    engine VARCHAR(80) NOT NULL DEFAULT 'google_ads_transparency_center',
    region VARCHAR(20) NOT NULL DEFAULT '2076',
    platform VARCHAR(20) NOT NULL DEFAULT 'SEARCH',
    requested_num SMALLINT NOT NULL DEFAULT 100,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    provider_search_id VARCHAR(120),
    total_results INTEGER,
    creatives_found INTEGER NOT NULL DEFAULT 0,
    next_page_token TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT transparency_scans_requested_num_check
        CHECK (requested_num BETWEEN 1 AND 100),
    CONSTRAINT transparency_scans_status_check
        CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT transparency_scans_creatives_found_check
        CHECK (creatives_found >= 0),
    CONSTRAINT transparency_scans_total_results_check
        CHECK (total_results IS NULL OR total_results >= 0)
);

CREATE TABLE IF NOT EXISTS radar.transparency_creative_observations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scan_id BIGINT NOT NULL REFERENCES radar.transparency_scans(id),
    google_advertiser_id VARCHAR(40) NOT NULL,
    ad_creative_id VARCHAR(40) NOT NULL,
    advertiser_name VARCHAR(255),
    target_domain VARCHAR(255),
    creative_format VARCHAR(20),
    image_url TEXT,
    preview_link TEXT,
    width INTEGER,
    height INTEGER,
    first_shown_epoch BIGINT,
    last_shown_epoch BIGINT,
    details_link TEXT,
    serpapi_details_link TEXT,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT transparency_creatives_scan_advertiser_creative_unique
        UNIQUE (scan_id, google_advertiser_id, ad_creative_id)
);

CREATE INDEX IF NOT EXISTS transparency_scans_advertiser_requested_idx
    ON radar.transparency_scans (advertiser_id, requested_at);

CREATE INDEX IF NOT EXISTS transparency_creatives_advertiser_idx
    ON radar.transparency_creative_observations (
        google_advertiser_id,
        observed_at
    );

CREATE INDEX IF NOT EXISTS transparency_creatives_target_domain_idx
    ON radar.transparency_creative_observations (
        target_domain,
        observed_at
    );

COMMIT;
