# Migration 012 — Add `dev` Role (DRAFT)

> **상태**: DRAFT — DDL/롤백 spec 단계. 실파일 `backend/migrations/012_add_dev_role.sql`은 **구현 phase 승인 후** 본 문서 기반으로 생성.
> **상위 plan**: `.omc/plans/design-admin-role-overhaul.md`
> **관련 결정**: `docs/specs/reviews/design-prototype-audit.md` ADR §5 — Decision #5

---

## 1. 변경 사항

`users.role`의 허용 값에 `'dev'` 추가.

기존: `enum: user | manager | admin`
변경: `enum: user | manager | admin | dev`

### 1.1 스키마 정의 위치

`backend/migrations/001_init.sql` 또는 사용자 테이블 정의 마이그레이션을 grep 후 확인 (구현 phase 작업).
현재 `requirements.md` §4 정의: `role(enum: user/manager/admin)` → text+CHECK 또는 PG enum 둘 중 어느 방식인지 마이그레이션 sourcing 필요.

### 1.2 변경 방식 — text+CHECK 가정

```sql
-- 011 이후 신규 마이그레이션
BEGIN;

-- (1) 기존 CHECK 제거
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- (2) 새 CHECK 추가
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'manager', 'admin', 'dev'));

COMMIT;
```

### 1.3 PG enum인 경우

```sql
BEGIN;
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'dev';
COMMIT;
```

> ⚠️ PG `ALTER TYPE ... ADD VALUE`는 **트랜잭션 내 일부 환경에서 제한**. PG ≥ 12부터는 가능하나, PG 14+ 권장. 실파일 작성 전 backend/migrations 기존 스타일 확인.

## 2. 롤백

### text+CHECK

```sql
BEGIN;

-- (1) dev 사용 row 제거 또는 'user'로 강등 (운영 데이터 정책 결정 필요)
UPDATE users SET role = 'user' WHERE role = 'dev';
-- 또는: SELECT count(*) FROM users WHERE role = 'dev'; -> 0 이어야 함.

-- (2) CHECK 복구
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'manager', 'admin'));

COMMIT;
```

### PG enum

`DROP VALUE`는 PostgreSQL이 직접 지원하지 않음. 롤백은 **enum 재생성** 필요:

```sql
-- (1) dev 사용 row 'user'로 강등
UPDATE users SET role = 'user' WHERE role = 'dev';

-- (2) 새 enum 생성, 컬럼 swap, 구 enum drop
CREATE TYPE user_role_new AS ENUM ('user', 'manager', 'admin');
ALTER TABLE users
  ALTER COLUMN role TYPE user_role_new
  USING role::text::user_role_new;
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;
```

## 3. Seed 데이터 (mock 환경)

`backend/seeds/mock-users.sql`에 추가될 row (구현 phase에서 적용):

```sql
INSERT INTO users (id, ad_username, display_name, email, role, is_active, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'mock_dev',
  'Mock Dev',
  'dev@company.com',
  'dev',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;
```

`requirements.md` §14.5 Mock User Fixtures 표에 dev 행 추가 (이번 spec 갱신에 포함).

## 4. 검증 (마이그레이션 실파일 작성 시)

1. `psql -c "INSERT INTO users (..., role) VALUES (..., 'dev');"` → 성공.
2. `psql -c "INSERT INTO users (..., role) VALUES (..., 'engineer');"` → CHECK 실패 / enum invalid.
3. `psql -c "SELECT enum_range(NULL::user_role);"` (enum인 경우) → `{user,manager,admin,dev}`.
4. 기존 `manager` 계정 한 건 골라 `UPDATE users SET role = 'dev' WHERE id = ...;` → 성공.
5. 마지막 admin 강등 트랜잭션 가드(`requirements.md` §8.3 룰)는 **본 마이그레이션 외부** 비즈니스 로직 — BE 권한 변경 API에서 검증.

## 5. 코드 동기화 (구현 phase 체크리스트)

- [ ] `backend/src/auth/types.ts` (또는 동등): `Role` union에 `'dev'` 추가.
- [ ] `backend/src/auth/mockUsers.ts`: dev fixture 추가.
- [ ] `frontend/src/auth/types.ts` (또는 동등): 동일.
- [ ] `frontend/src/auth/mockUsers.ts`: 동일.
- [ ] `POST /api/auth/mock-login` body validator: enum 확장.
- [ ] BE 권한 미들웨어: `requirements.md` §8.3 매트릭스 + `feature-voc.md` §8.4-bis `assertCanManageVoc` 적용.
- [ ] FE role guard hook (`useRequireRole`, `useCanAccessDashboard` 등) 분기 갱신.
- [ ] role-pill UI 컴포넌트에 `dev` variant 추가 — uidesign.md §13.3 매핑.
- [ ] BE 테스트: User/Dev/Manager/Admin × VOC ownership 매트릭스 회귀 케이스.

## 6. 호환성 노트

- `dev` 신설은 **순수 추가** — 기존 user/manager/admin 동작 무변경.
- 다운그레이드 시 dev 계정은 자동으로 `user`로 강등 (운영 정책 결정 필요).
- AD/SSO 자동 생성(§15.2) 시 기본 role은 여전히 `user`. Admin이 명시적으로 `dev`/`manager`로 승급.
