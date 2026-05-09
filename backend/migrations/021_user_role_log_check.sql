-- 021: user_role_log role CHECK constraints (FU-010)
--
-- Spec lock:
--   - docs/specs/plans/followup-bucket.md FU-010 (PR #250 codex deferral)
--   - docs/specs/requires/feature-voc.md §8.3 / D18 (`users.role` enum: user/dev/manager/admin)
--
-- Defense-in-depth: BE validator (`backend/src/services/admin/user-admin.ts`)
-- is the primary gate for role-change writes. CHECK 는 DB-side invariant 보강
-- 으로, validator 가 우회되거나 SQL 직삽입이 발생해도 audit row 가 의미를 잃지
-- 않도록 한다.
--
-- NULL 허용: `old_role` / `new_role` 는 sentinel — 시스템 자동 변경(예: AD
-- 비활성 sync) 등에서 한쪽 또는 양쪽이 비어 있을 수 있으므로 NULL 통과를
-- 명시적으로 허용한다.
--
-- 회귀 테스트: backend/src/__tests__/migration-021-user-role-log-check.test.ts
-- (up 적용 → 유효 4 값 통과 / 무효 거부 / NULL 허용, down 적용 → 무효 통과).

-- Up Migration

ALTER TABLE user_role_log
  ADD CONSTRAINT user_role_log_old_role_check
  CHECK (old_role IS NULL OR old_role IN ('user', 'dev', 'manager', 'admin'));

ALTER TABLE user_role_log
  ADD CONSTRAINT user_role_log_new_role_check
  CHECK (new_role IS NULL OR new_role IN ('user', 'dev', 'manager', 'admin'));

-- Down Migration

ALTER TABLE user_role_log
  DROP CONSTRAINT IF EXISTS user_role_log_new_role_check;

ALTER TABLE user_role_log
  DROP CONSTRAINT IF EXISTS user_role_log_old_role_check;
