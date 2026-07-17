ALTER TABLE radar.landing_page_snapshots
    ADD COLUMN h2 JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN whatsapp_links JSONB NOT NULL DEFAULT '[]'::jsonb;
