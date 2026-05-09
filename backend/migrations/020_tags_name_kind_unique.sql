-- migration 020 — FU-014: tags(name, kind) UNIQUE
--
-- Spec: docs/specs/plans/followup-bucket.md FU-014.
-- Pre-020 (004_tags.sql): only `slug UNIQUE`. Same `name` across different
-- `kind` values (general / menu) is conceptually allowed, but two general tags
-- with the same `name` happened to collide via slug derivation only by accident.
-- Post-020: explicit composite UNIQUE (name, kind) — same name across different
-- kinds remains allowed; duplicate (name, kind) is rejected at the DB layer.
--
-- Pre-flight: this migration assumes no existing duplicates. The seed/fixture
-- data uses unique (name, kind) tuples. Production deploy MUST run the
-- duplicate-detection SELECT below before applying.

-- Up Migration

-- Pre-flight detection (manual operator step — not enforced by this script):
-- SELECT name, kind, COUNT(*) FROM tags GROUP BY name, kind HAVING COUNT(*) > 1;

ALTER TABLE tags
  ADD CONSTRAINT tags_name_kind_uniq UNIQUE (name, kind);

-- Down Migration
ALTER TABLE tags DROP CONSTRAINT tags_name_kind_uniq;
