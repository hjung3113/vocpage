-- 013_add_dev_role.sql
-- Adds 'dev' to the users.role enum (text + CHECK).
-- Spec: docs/specs/plans/migration-012-draft.md (draft was authored when 012 was the next slot;
--       012 was consumed by voc_origin_metadata, so the dev-role migration lands as 013).

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'manager', 'admin', 'dev'));

COMMIT;
