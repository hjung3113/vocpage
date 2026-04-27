-- 012_voc_origin_metadata.sql
-- Adds source_sp + related_tables metadata referenced by feature-voc.md §9.4.5.1
-- Rollback: ALTER TABLE vocs DROP COLUMN source_sp, DROP COLUMN related_tables; -- (no concurrent migration in dev; production should split into separate CONCURRENTLY phases)

ALTER TABLE vocs ADD COLUMN source_sp text NULL;
ALTER TABLE vocs ADD COLUMN related_tables jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE vocs ADD CONSTRAINT vocs_related_tables_is_array CHECK (jsonb_typeof(related_tables) = 'array');
COMMENT ON COLUMN vocs.source_sp IS 'Stored procedure / origin function name surfaced in Result Review detail drawer';
COMMENT ON COLUMN vocs.related_tables IS 'jsonb array of related DB table names; viewable in Result Review detail (Admin-gated when classified)';
-- Note: GIN index decision deferred (see feature-voc.md §9.4.5.1 "indexability TBD")
