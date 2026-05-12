-- 024: tag_rules schema reshape (Phase 1 — D-05 / D-06 / D-12, OQ-R1 Option C)
--
-- Spec: docs/specs/requires/feature-voc.md §9.4.1 (rewritten this phase by Plan 08)
--       .planning/phases/01-tag-rules-consolidation/01-CONTEXT.md D-05/D-06/D-12 + oq_resolutions
--
-- Up:
--   ADD COLUMN keywords    text[]  NOT NULL DEFAULT '{}'    -- chip-array per D-05
--   ADD COLUMN match_mode  text    NOT NULL DEFAULT 'keyword' -- D-06 select slot
--   ADD COLUMN created_by  uuid    NULL REFERENCES users(id) -- D-12; NULL preserved
--   DROP COLUMN pattern                                       -- legacy single-regex column
--
-- Down:
--   ADD COLUMN pattern     text    NOT NULL DEFAULT ''
--   DROP COLUMN keywords / match_mode / created_by
--
-- 회귀 테스트: backend/src/__tests__/migration-024.test.ts (pg-mem up/down round-trip).

-- Up Migration

ALTER TABLE tag_rules
  ADD COLUMN keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN match_mode text NOT NULL DEFAULT 'keyword',
  ADD COLUMN created_by uuid NULL REFERENCES users(id),
  DROP COLUMN pattern;

-- Down Migration

ALTER TABLE tag_rules
  ADD COLUMN pattern text NOT NULL DEFAULT '',
  DROP COLUMN IF EXISTS keywords,
  DROP COLUMN IF EXISTS match_mode,
  DROP COLUMN IF EXISTS created_by;
