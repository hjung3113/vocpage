-- Up Migration
-- P0: Ensure at most one admin-default row (user_id IS NULL).
-- The base UNIQUE(user_id) does NOT enforce this in Postgres because NULL
-- values are treated as distinct from each other, allowing duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_settings_admin_default_uniq
  ON dashboard_settings ((user_id IS NULL))
  WHERE user_id IS NULL;

-- Down Migration
DROP INDEX IF EXISTS dashboard_settings_admin_default_uniq;
