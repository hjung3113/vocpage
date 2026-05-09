-- 022: dashboard_settings.locked_widgets — Wave 2 W2-2 / PR-β
--
-- Spec lock:
--   - docs/specs/requires/dashboard.md §커스터마이즈 v2 §잠금 머지 규칙
--   - docs/specs/plans/wave-2-dashboard.md §3 W2-D3, §6.2 W2-2
--
-- Purpose: 2-tier 잠금 (Admin 강제 / 개인 자기 화면) 중 Admin tier 의 SSOT.
-- Admin 행 (`user_id IS NULL`) 에서만 의미 있는 컬럼 — 개인 행은 `[]` 유지.
-- 머지 규칙: `static = adminLocked || personalLocked` (개인 unlock 으로 Admin
-- lock 해제 불가). FE/BE 양측 동일 규칙.
--
-- 도메인: 위젯 ID 문자열 배열. dashboard.md §위젯 상세 명세 1~11 의 stable
-- ID — `kpi` / `distribution` / `priority-status-matrix` / `heatmap` /
-- `weekly-trend` / `tag-bar` / `system-card` / `assignee-table` / `aging-top10`
-- / `sla` / `aging`. 신규 위젯 추가 시 본 컬럼 schema 변경 없이 string append.
--
-- 권한: mutate 는 Admin only (BE 403 + FE 토글 hidden — `dashboard.md §잠금
-- 머지 규칙`). 검증은 zod (`shared/contracts/dashboard.ts`) + 라우트 가드 이중.
--
-- Backfill: 기존 row 모두 `[]` 로 초기화 — DEFAULT '[]'::jsonb 가 NOT NULL
-- 보장. Wave 2 미출시 시점에는 Admin 행이 1 건 (시드) — `[]` 유지.
--
-- 회귀 테스트: backend/src/__tests__/migration-022-dashboard-locked-widgets.test.ts
-- (up 적용 → 컬럼 존재 / DEFAULT '[]' / 위젯 ID 배열 삽입, down 적용 → 컬럼 제거).

-- Up Migration

ALTER TABLE dashboard_settings
  ADD COLUMN locked_widgets jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN dashboard_settings.locked_widgets IS
  'Admin-tier widget lock list. Meaningful only on the Admin row (user_id IS NULL). Personal rows keep []. Merge rule: static = adminLocked || personalLocked.';

-- Down Migration

ALTER TABLE dashboard_settings
  DROP COLUMN IF EXISTS locked_widgets;
