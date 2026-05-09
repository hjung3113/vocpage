-- 017: user_role_log — Users 화면(Admin) role / is_active 변경 audit (W3-9, OQ-3 Option A).
--
-- Spec: docs/specs/requires/requirements.md §4 (`user_role_log`),
--       docs/specs/plans/wave-3-admin.md §6.2 W3-9 + OQ-3 (Option A).
--
-- Design notes:
-- - id PK uuid (uuid-ossp 이미 마이그 001 에서 활성화).
-- - user_id / changed_by 둘 다 ON DELETE RESTRICT — audit row 의 주체·변경자
--   reference 가 사라지면 감사 로그의 가치가 깨지므로 사용자 삭제는 별도 정책
--   (anonymise 또는 archive) 으로 처리한다. CASCADE / SET NULL 절대 금지.
-- - changed_by NOT NULL — 시스템 자동 변경(예: AD 비활성 sync)도 system 계정 user
--   row 를 삽입해 attribute 한다.
-- - old_role / new_role text (users.role enum 과 동일 도메인이지만 audit 은 과거값 보존
--   이 우선이라 enum 변경 영향을 받지 않도록 자유 텍스트로 둠).
-- - reason NULL 허용 — 일상 토글은 사유 없이 진행 가능, 정책상 강제는 BE validator 단.
-- - 인덱스 (user_id, created_at DESC): 사용자별 최근 변경 이력 조회가 dominant
--   query (Users detail timeline).
-- - 보존: PIPA 7 년 (requirements.md §15.1.1 precedent). 별도 retention job 은 후속.

-- Up Migration

CREATE TABLE user_role_log (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  changed_by  uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  old_role    text,
  new_role    text,
  old_active  boolean,
  new_active  boolean,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_role_log_user_created
  ON user_role_log (user_id, created_at DESC);

-- Down Migration

DROP INDEX IF EXISTS idx_user_role_log_user_created;
DROP TABLE IF EXISTS user_role_log;
