-- 014: Tag Master operational columns (W3-1, OQ-4 결정 2026-05-09)
--
-- Spec: docs/specs/requires/requirements.md §15.3
--       docs/specs/requires/feature-voc.md §9.4.6
--       docs/specs/plans/wave-3-admin.md W3-1
--
-- Adds two columns supporting Tag Master operational gaps (ADR 0004 — OQ-1
-- Option D Manager+ add/edit · Admin only merge / 외부잠금 / 영구삭제 / 규칙
-- 일시중지):
--
--   1. tags.is_external          — Admin-only 외부잠금 토글. NOT NULL DEFAULT
--                                  false 으로 기존 row backfill.
--   2. tag_rules.suspended_until — 규칙 일시중지 타임스탬프. NULL = 활성.
--
-- Resolution α (2026-05-09): `tags.merged_into_id` 자기참조 FK 는 본 마이
-- 그레이션에서 제외한다. 병합 동작은 `feature-voc.md §9.4.6` · ADR 0004 의
-- source-row hard-delete 정책 그대로이며, 추후 감사 흔적이 필요해지면 별도
-- `tag_merge_log` 테이블을 미래 마이그레이션에서 추가한다.
--
-- 회귀 테스트: backend/src/__tests__/migration-014.test.ts (up 적용 → 컬럼
-- 검증 → down 적용 → 컬럼 제거 검증, pg-mem 라운드 트립).

-- Up Migration

ALTER TABLE tags
  ADD COLUMN is_external boolean NOT NULL DEFAULT false;

ALTER TABLE tag_rules
  ADD COLUMN suspended_until timestamptz NULL;

-- Down Migration

ALTER TABLE tags
  DROP COLUMN IF EXISTS is_external;

ALTER TABLE tag_rules
  DROP COLUMN IF EXISTS suspended_until;
