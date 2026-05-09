-- 021: user_role_log role CHECK constraints (FU-010)
--
-- Spec lock:
--   - docs/specs/plans/followup-bucket.md FU-010 (PR #250 codex deferral)
--   - docs/specs/requires/feature-voc.md §8.3 / D18 (`users.role` enum: user/dev/manager/admin)
--
-- Defense-in-depth: route-level zod validator (`AdminUserPatch` in
-- `shared/contracts/admin/user.ts`, applied via `validate()` in
-- `backend/src/routes/admin-users.ts`) is the primary gate for role-change
-- writes from HTTP. CHECK 는 DB-side invariant 보강 — 향후 service 직접
-- 호출 (테스트 / 스크립트 / SQL 직삽입) 등 zod 게이트를 우회하는 경로에서도
-- audit row 가 도메인 일관성을 잃지 않도록 한다.
--
-- NULL 허용: `old_role` / `new_role` 는 sentinel — 시스템 자동 변경(예: AD
-- 비활성 sync) 등에서 한쪽 또는 양쪽이 비어 있을 수 있으므로 NULL 통과를
-- 명시적으로 허용한다.
--
-- 회귀 테스트: backend/src/__tests__/migration-021-user-role-log-check.test.ts
-- (up 적용 → 유효 4 값 통과 / 무효 거부 / NULL 허용, down 적용 → 무효 통과).
--
-- Role 도메인은 마이그 013 (`users_role_check`) 과 동일. 향후 5 번째 role
-- 추가 시 본 두 CHECK 도 함께 갱신해야 한다 (정합 깨짐 시 audit row hard-fail).
--
-- Backfill safety: NOT VALID 로 추가하여 기존 row 검증을 별도 step 으로 분리.
-- 17 머지 이후 SQL 직삽입 / 시드 / pre-validator 경로로 무효 role 이 들어
-- 있으면 plain ADD CONSTRAINT 가 deploy 직 실패한다 — 마이그 020 패턴.

-- Up Migration

-- Pre-flight (operator manual step — 본 deploy 직전 0 row 임을 확인):
--
-- SELECT id, old_role, new_role
-- FROM user_role_log
-- WHERE (old_role IS NOT NULL AND old_role NOT IN ('user', 'dev', 'manager', 'admin'))
--    OR (new_role IS NOT NULL AND new_role NOT IN ('user', 'dev', 'manager', 'admin'));
--
-- 위 SELECT 가 0 row 인 것을 확인한 다음, 별도 step 으로 VALIDATE 실행:
--
--   ALTER TABLE user_role_log VALIDATE CONSTRAINT user_role_log_old_role_check;
--   ALTER TABLE user_role_log VALIDATE CONSTRAINT user_role_log_new_role_check;

ALTER TABLE user_role_log
  ADD CONSTRAINT user_role_log_old_role_check
  CHECK (old_role IS NULL OR old_role IN ('user', 'dev', 'manager', 'admin'))
  NOT VALID;

ALTER TABLE user_role_log
  ADD CONSTRAINT user_role_log_new_role_check
  CHECK (new_role IS NULL OR new_role IN ('user', 'dev', 'manager', 'admin'))
  NOT VALID;

-- Down Migration

ALTER TABLE user_role_log
  DROP CONSTRAINT IF EXISTS user_role_log_new_role_check;

ALTER TABLE user_role_log
  DROP CONSTRAINT IF EXISTS user_role_log_old_role_check;
