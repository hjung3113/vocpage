-- 014: Tag Master operational columns (W3-1, OQ-4 결정 2026-05-09)
--
-- Spec: docs/specs/requires/requirements.md §15.3
--       docs/specs/requires/feature-voc.md §9.4.6
--       docs/specs/plans/wave-3-admin.md W3-1
--
-- Adds three columns supporting Tag Master operational gaps (ADR 0004 — OQ-1
-- Option D Manager+ add/edit · Admin only merge / 외부잠금 / 영구삭제 / 규칙
-- 일시중지):
--
--   1. tags.is_external          — Admin-only 외부잠금 토글. NOT NULL DEFAULT
--                                  false 으로 기존 row backfill.
--   2. tags.merged_into_id       — 병합 흔적. 자기참조 FK. 합쳐진 target 이
--                                  hard delete 되어도 source 행은 보존
--                                  되어야 하므로 ON DELETE SET NULL.
--   3. tag_rules.suspended_until — 규칙 일시중지 타임스탬프. NULL = 활성.
--
-- 회귀 테스트: backend/src/__tests__/migration-014.test.ts (up 적용 → 컬럼·
-- FK 검증 → down 적용 → 컬럼 제거 검증, pg-mem 라운드 트립).

-- Up Migration

ALTER TABLE tags
  ADD COLUMN is_external boolean NOT NULL DEFAULT false;

ALTER TABLE tags
  ADD COLUMN merged_into_id uuid NULL
    REFERENCES tags(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tags_merged_into_id
  ON tags (merged_into_id)
  WHERE merged_into_id IS NOT NULL;

ALTER TABLE tag_rules
  ADD COLUMN suspended_until timestamptz NULL;

-- Down Migration

DROP INDEX IF EXISTS idx_tags_merged_into_id;

ALTER TABLE tags
  DROP COLUMN IF EXISTS merged_into_id;

ALTER TABLE tags
  DROP COLUMN IF EXISTS is_external;

ALTER TABLE tag_rules
  DROP COLUMN IF EXISTS suspended_until;
