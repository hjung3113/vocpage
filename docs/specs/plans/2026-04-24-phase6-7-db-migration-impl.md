# Phase 6-7: DB 마이그레이션 & 시드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** node-pg-migrate 기반으로 6개 마이그레이션 파일 + entrypoint.sh + dev_seed.sql을 구현하여 `docker compose up` 시 자동으로 DB 스키마가 생성되도록 한다.

**Architecture:** `backend/entrypoint.sh`가 Docker 시작 시 `npm run db:migrate`를 먼저 실행한 뒤 Express dev 서버를 기동한다. 마이그레이션은 도메인별 6개 SQL 파일로 분리하며 node-pg-migrate가 `pgmigrations` 테이블로 실행 이력을 추적한다. 시드는 별도 `npm run db:seed` 스크립트로 최초 1회 수동 실행한다.

**Tech Stack:** node-pg-migrate, pg, PostgreSQL 16, pgvector, Docker Compose

---

## File Map

| 액션   | 경로                                     | 역할                                                                               |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| MODIFY | `backend/package.json`                   | node-pg-migrate·pg 의존성 + db:migrate·db:seed 스크립트                            |
| MODIFY | `backend/Dockerfile`                     | postgresql-client 설치 + CMD → entrypoint.sh                                       |
| CREATE | `backend/entrypoint.sh`                  | migrate → npm run dev 실행 순서                                                    |
| CREATE | `backend/migrations/001_extensions.sql`  | pgvector, uuid-ossp extension                                                      |
| CREATE | `backend/migrations/002_core_tables.sql` | users, systems, menus, voc_types + updated_at 트리거 함수                          |
| CREATE | `backend/migrations/003_vocs.sql`        | vocs, voc_sequence_counters, voc_history, voc_payload_reviews, voc_payload_history |
| CREATE | `backend/migrations/004_tags.sql`        | tags, voc_tags, tag_rules                                                          |
| CREATE | `backend/migrations/005_content.sql`     | comments, voc_internal_notes, attachments, notices, faq_categories, faqs           |
| CREATE | `backend/migrations/006_settings.sql`    | dashboard_settings, notifications                                                  |
| CREATE | `backend/seeds/dev_seed.sql`             | 개발용 초기 데이터 (ON CONFLICT DO NOTHING)                                        |

---

## Task 1: node-pg-migrate 설치 + npm 스크립트 추가

**Files:**

- Modify: `backend/package.json`

- [ ] **Step 1: node-pg-migrate + pg 패키지 설치**

```bash
cd /path/to/vocpage
npm install --workspace=backend node-pg-migrate pg
npm install --workspace=backend --save-dev @types/pg
```

- [ ] **Step 2: 설치 확인**

```bash
npm list --workspace=backend node-pg-migrate pg
```

Expected 출력 (버전은 다를 수 있음):

```
@vocpage/backend@0.0.1
├── node-pg-migrate@7.x.x
└── pg@8.x.x
```

- [ ] **Step 3: package.json 스크립트 추가**

`backend/package.json`의 `"scripts"` 블록을 아래로 교체:

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "jest --runInBand",
  "typecheck": "tsc --noEmit",
  "db:migrate": "node-pg-migrate up -m migrations",
  "db:migrate:down": "node-pg-migrate down -m migrations",
  "db:seed": "psql $DATABASE_URL -f seeds/dev_seed.sql"
}
```

- [ ] **Step 4: 커밋**

```bash
git add backend/package.json package-lock.json
git commit -m "chore(db): install node-pg-migrate and add db scripts"
```

---

## Task 2: 001_extensions.sql

**Files:**

- Create: `backend/migrations/001_extensions.sql`

- [ ] **Step 1: migrations 디렉터리 생성 + 파일 작성**

`backend/migrations/001_extensions.sql`:

```sql
-- pgvector: 임베딩 벡터 컬럼 (embedding vector(1536)) 지원
CREATE EXTENSION IF NOT EXISTS vector;

-- uuid-ossp: uuid_generate_v4() 함수 제공
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

- [ ] **Step 2: 커밋**

```bash
git add backend/migrations/001_extensions.sql
git commit -m "feat(db): add 001_extensions migration (pgvector, uuid-ossp)"
```

---

## Task 3: 002_core_tables.sql

**Files:**

- Create: `backend/migrations/002_core_tables.sql`

- [ ] **Step 1: 파일 작성**

`backend/migrations/002_core_tables.sql`:

```sql
-- updated_at 자동 갱신 트리거 함수 (공통 재사용)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users: AD 기반 사용자. MVP에서는 mock fixture와 UUID 일치 필수
CREATE TABLE users (
  id            uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_username   text        NOT NULL UNIQUE,
  display_name  text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  role          text        NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'manager', 'admin')),
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- systems: VOC가 속하는 원천 시스템 (분석시스템, 생산관리 등)
CREATE TABLE systems (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  is_archived boolean     NOT NULL DEFAULT false
);

-- menus: 시스템 내 메뉴 (화면 단위)
CREATE TABLE menus (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  system_id   uuid        NOT NULL REFERENCES systems(id),
  name        text        NOT NULL,
  slug        text        NOT NULL,
  is_archived boolean     NOT NULL DEFAULT false,
  UNIQUE (system_id, slug)
);

-- voc_types: VOC 분류 (버그·기능요청·개선제안·문의)
CREATE TABLE voc_types (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  color       text        NOT NULL DEFAULT 'gray',
  sort_order  int         NOT NULL DEFAULT 0,
  is_archived boolean     NOT NULL DEFAULT false
);
```

- [ ] **Step 2: 커밋**

```bash
git add backend/migrations/002_core_tables.sql
git commit -m "feat(db): add 002_core_tables migration (users, systems, menus, voc_types)"
```

---

## Task 4: 003_vocs.sql

**Files:**

- Create: `backend/migrations/003_vocs.sql`

- [ ] **Step 1: 파일 작성**

`backend/migrations/003_vocs.sql`:

```sql
-- 시스템×연도별 sequence_no 카운터 테이블
CREATE TABLE voc_sequence_counters (
  system_id uuid NOT NULL REFERENCES systems(id),
  year      int  NOT NULL,
  last_seq  int  NOT NULL DEFAULT 0,
  PRIMARY KEY (system_id, year)
);

-- sequence_no 자동 채번 트리거 함수
-- BEFORE INSERT 시점에 실행 → created_at DEFAULT(now())가 이미 적용된 상태
CREATE OR REPLACE FUNCTION generate_voc_sequence_no()
RETURNS TRIGGER AS $$
DECLARE
  v_year int;
  v_seq  int;
BEGIN
  v_year := EXTRACT(YEAR FROM NEW.created_at)::int;

  INSERT INTO voc_sequence_counters (system_id, year, last_seq)
  VALUES (NEW.system_id, v_year, 1)
  ON CONFLICT (system_id, year)
  DO UPDATE SET last_seq = voc_sequence_counters.last_seq + 1
  RETURNING last_seq INTO v_seq;

  NEW.sequence_no := v_seq;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- vocs: VOC 메인 테이블
CREATE TABLE vocs (
  id                        uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  title                     text        NOT NULL,
  body                      text        NOT NULL,
  status                    text        NOT NULL DEFAULT '접수'
                                        CHECK (status IN ('접수','검토중','처리중','완료','드랍')),
  priority                  text        NOT NULL DEFAULT 'medium'
                                        CHECK (priority IN ('low','medium','high','urgent')),
  reporter_id               uuid        NOT NULL REFERENCES users(id),
  assignee_id               uuid        REFERENCES users(id),
  system_id                 uuid        NOT NULL REFERENCES systems(id),
  menu_id                   uuid        REFERENCES menus(id),
  voc_type_id               uuid        REFERENCES voc_types(id),
  sequence_no               int,
  structured_payload        jsonb,
  structured_payload_draft  jsonb,
  review_status             text        CHECK (review_status IN ('unverified','approved','rejected','pending_deletion')),
  embed_stale               boolean     NOT NULL DEFAULT false,
  embedding                 vector(1536),
  resolution_quality        text        CHECK (resolution_quality IN ('근본해결','임시조치')),
  drop_reason               text        CHECK (drop_reason IN ('중복','정책거부','재현불가','범위외','기타')),
  source                    text        NOT NULL DEFAULT 'manual'
                                        CHECK (source IN ('manual','import')),
  deleted_at                timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_voc_sequence_no
  BEFORE INSERT ON vocs
  FOR EACH ROW
  WHEN (NEW.sequence_no IS NULL)
  EXECUTE FUNCTION generate_voc_sequence_no();

CREATE TRIGGER trg_vocs_updated_at
  BEFORE UPDATE ON vocs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- voc_history: 필드 변경 이력
CREATE TABLE voc_history (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id      uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  field       text        NOT NULL,
  old_value   text,
  new_value   text,
  changed_by  uuid        NOT NULL REFERENCES users(id),
  changed_at  timestamptz NOT NULL DEFAULT now()
);

-- voc_payload_reviews: structured_payload 리뷰 이력
CREATE TABLE voc_payload_reviews (
  id              uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id          uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  action          text        NOT NULL CHECK (action IN ('submission','deletion')),
  reviewer_id     uuid        NOT NULL REFERENCES users(id),
  decision        text        NOT NULL CHECK (decision IN ('approved','rejected')),
  comment         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- voc_payload_history: structured_payload 제출 스냅샷
CREATE TABLE voc_payload_history (
  id            uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id        uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  payload       jsonb       NOT NULL,
  submitted_by  uuid        NOT NULL REFERENCES users(id),
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  final_state   text        CHECK (final_state IN ('approved','rejected','deleted','active')),
  is_current    boolean     NOT NULL DEFAULT false
);
```

- [ ] **Step 2: 커밋**

```bash
git add backend/migrations/003_vocs.sql
git commit -m "feat(db): add 003_vocs migration (vocs + sequence trigger + history tables)"
```

---

## Task 5: 004_tags.sql

**Files:**

- Create: `backend/migrations/004_tags.sql`

- [ ] **Step 1: 파일 작성**

`backend/migrations/004_tags.sql`:

```sql
-- tags: general(자동 태깅 대상) | menu(메뉴 연결 태그)
CREATE TABLE tags (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  kind       text        NOT NULL DEFAULT 'general'
                         CHECK (kind IN ('general','menu')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- voc_tags: VOC ↔ 태그 N:M (source: manual 수동 | rule 자동 규칙)
CREATE TABLE voc_tags (
  voc_id     uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  tag_id     uuid        NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source     text        NOT NULL DEFAULT 'manual'
                         CHECK (source IN ('manual','rule')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (voc_id, tag_id)
);

-- tag_rules: kind='general' 자동 부착 규칙 (키워드·정규식 매칭)
CREATE TABLE tag_rules (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       text        NOT NULL,
  pattern    text        NOT NULL,
  kind       text        NOT NULL DEFAULT 'general'
                         CHECK (kind IN ('general')),
  tag_id     uuid        NOT NULL REFERENCES tags(id),
  is_active  boolean     NOT NULL DEFAULT true,
  sort_order int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: 커밋**

```bash
git add backend/migrations/004_tags.sql
git commit -m "feat(db): add 004_tags migration (tags, voc_tags, tag_rules)"
```

---

## Task 6: 005_content.sql

**Files:**

- Create: `backend/migrations/005_content.sql`

- [ ] **Step 1: 파일 작성**

`backend/migrations/005_content.sql`:

```sql
-- comments: VOC 댓글 (User 이상 열람, Manager/Admin 포함)
CREATE TABLE comments (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id     uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES users(id),
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- voc_internal_notes: 내부 메모 (Manager/Admin 전용, User에게 404)
CREATE TABLE voc_internal_notes (
  id         bigserial   PRIMARY KEY,
  voc_id     uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES users(id),
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER trg_voc_internal_notes_updated_at
  BEFORE UPDATE ON voc_internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- attachments: VOC 첨부파일 메타데이터 (실파일은 Docker named volume uploads_data)
CREATE TABLE attachments (
  id           uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id       uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  uploader_id  uuid        NOT NULL REFERENCES users(id),
  filename     text        NOT NULL,
  mime_type    text        NOT NULL,
  size_bytes   int         NOT NULL,
  storage_path text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- notices: 공지사항
CREATE TABLE notices (
  id           uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        text        NOT NULL,
  body         text        NOT NULL,
  level        text        NOT NULL DEFAULT 'normal'
                           CHECK (level IN ('normal','important','urgent')),
  is_popup     boolean     NOT NULL DEFAULT false,
  is_visible   boolean     NOT NULL DEFAULT true,
  visible_from date,
  visible_to   date,
  author_id    uuid        NOT NULL REFERENCES users(id),
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- faq_categories: FAQ 카테고리
CREATE TABLE faq_categories (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text    NOT NULL,
  slug        text    NOT NULL UNIQUE,
  sort_order  int     NOT NULL DEFAULT 0,
  is_archived boolean NOT NULL DEFAULT false
);

-- faqs: FAQ 항목
CREATE TABLE faqs (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  question    text        NOT NULL,
  answer      text        NOT NULL,
  category_id uuid        NOT NULL REFERENCES faq_categories(id),
  is_visible  boolean     NOT NULL DEFAULT true,
  sort_order  int         NOT NULL DEFAULT 0,
  author_id   uuid        NOT NULL REFERENCES users(id),
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

- [ ] **Step 2: 커밋**

```bash
git add backend/migrations/005_content.sql
git commit -m "feat(db): add 005_content migration (comments, notes, attachments, notices, faqs)"
```

---

## Task 7: 006_settings.sql

**Files:**

- Create: `backend/migrations/006_settings.sql`

- [ ] **Step 1: 파일 작성**

`backend/migrations/006_settings.sql`:

```sql
-- dashboard_settings: 사용자별 대시보드 설정 (user_id NULL = Admin 기본값)
CREATE TABLE dashboard_settings (
  id                    uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               uuid        REFERENCES users(id) UNIQUE,
  widget_order          jsonb       NOT NULL DEFAULT '[]',
  widget_visibility     jsonb       NOT NULL DEFAULT '{}',
  widget_sizes          jsonb       NOT NULL DEFAULT '{}',
  default_date_range    text        NOT NULL DEFAULT '30d'
                                    CHECK (default_date_range IN ('7d','30d','90d','custom')),
  heatmap_default_x_axis text       NOT NULL DEFAULT 'status'
                                    CHECK (heatmap_default_x_axis IN ('status','priority','tag')),
  locked_fields         jsonb       NOT NULL DEFAULT '[]',
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_dashboard_settings_updated_at
  BEFORE UPDATE ON dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- notifications: 알림 (comment·status_change·assigned)
CREATE TABLE notifications (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users(id),
  type       text        NOT NULL CHECK (type IN ('comment','status_change','assigned')),
  voc_id     uuid        NOT NULL REFERENCES vocs(id),
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: 커밋**

```bash
git add backend/migrations/006_settings.sql
git commit -m "feat(db): add 006_settings migration (dashboard_settings, notifications)"
```

---

## Task 8: entrypoint.sh + Dockerfile 수정

**Files:**

- Create: `backend/entrypoint.sh`
- Modify: `backend/Dockerfile`

- [ ] **Step 1: entrypoint.sh 작성**

`backend/entrypoint.sh`:

```sh
#!/bin/sh
set -e
npm run db:migrate
exec npm run dev
```

- [ ] **Step 2: Dockerfile 수정**

`backend/Dockerfile`의 전체 내용을 아래로 교체:

```dockerfile
FROM node:22-alpine AS development

# psql 클라이언트: db:seed 스크립트(psql $DATABASE_URL -f seeds/dev_seed.sql) 실행에 필요
RUN apk add --no-cache postgresql-client

WORKDIR /app

# workspace manifest 먼저 복사
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# 루트에서 설치
RUN npm ci

# 소스 복사
COPY backend/ ./backend/

WORKDIR /app/backend

RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
```

- [ ] **Step 3: 커밋**

```bash
git add backend/entrypoint.sh backend/Dockerfile
git commit -m "feat(db): add entrypoint.sh and update Dockerfile (migrate-then-dev)"
```

---

## Task 9: dev_seed.sql

**Files:**

- Create: `backend/seeds/dev_seed.sql`

- [ ] **Step 1: seeds 디렉터리 생성 + 파일 작성**

`backend/seeds/dev_seed.sql`:

```sql
-- 재실행 안전: ON CONFLICT DO NOTHING
-- UUID는 6-6 mockUsers.ts fixture와 동일해야 auth 미들웨어와 연동됨

-- users (3명 — mock fixture UUID 고정)
INSERT INTO users (id, ad_username, display_name, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'mock_admin',   'Mock Admin',   'admin@company.com',   'admin'),
  ('00000000-0000-0000-0000-000000000002', 'mock_manager', 'Mock Manager', 'manager@company.com', 'manager'),
  ('00000000-0000-0000-0000-000000000003', 'mock_user',    'Mock User',    'user@company.com',    'user')
ON CONFLICT (id) DO NOTHING;

-- systems (2개)
INSERT INTO systems (id, name, slug) VALUES
  ('10000000-0000-0000-0000-000000000001', '분석 시스템',   'analysis'),
  ('10000000-0000-0000-0000-000000000002', '생산관리 시스템', 'production')
ON CONFLICT (id) DO NOTHING;

-- menus (각 시스템당 3-4개)
INSERT INTO menus (id, system_id, name, slug) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '대시보드',   'dashboard'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '리포트',     'report'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '기타',       'etc'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '생산계획',   'plan'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '실적관리',   'performance'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '품질관리',   'quality'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '기타',       'etc')
ON CONFLICT (id) DO NOTHING;

-- voc_types (4종)
INSERT INTO voc_types (id, name, slug, color, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000001', '버그',      'bug',         'red',   1),
  ('30000000-0000-0000-0000-000000000002', '기능 요청', 'feature',     'blue',  2),
  ('30000000-0000-0000-0000-000000000003', '개선 제안', 'improvement', 'green', 3),
  ('30000000-0000-0000-0000-000000000004', '문의',      'inquiry',     'gray',  4)
ON CONFLICT (id) DO NOTHING;

-- tags (general 5개, menu 2개)
INSERT INTO tags (id, name, slug, kind) VALUES
  ('40000000-0000-0000-0000-000000000001', '성능',   'performance', 'general'),
  ('40000000-0000-0000-0000-000000000002', '오류',   'error',       'general'),
  ('40000000-0000-0000-0000-000000000003', 'UI',     'ui',          'general'),
  ('40000000-0000-0000-0000-000000000004', '데이터', 'data',        'general'),
  ('40000000-0000-0000-0000-000000000005', '권한',   'permission',  'general'),
  ('40000000-0000-0000-0000-000000000006', '대시보드 메뉴', 'menu-dashboard', 'menu'),
  ('40000000-0000-0000-0000-000000000007', '생산계획 메뉴', 'menu-plan',      'menu')
ON CONFLICT (id) DO NOTHING;

-- vocs (10건 — status·priority 다양 분포, 대시보드 위젯이 유의미하게 표시되도록)
-- sequence_no는 트리거가 자동 채번
INSERT INTO vocs (id, title, body, status, priority, reporter_id, assignee_id, system_id, menu_id, voc_type_id, source) VALUES
  ('50000000-0000-0000-0000-000000000001', '대시보드 로딩 속도 개선 요청', '분석 시스템 대시보드가 데이터 로드 시 10초 이상 걸립니다.',
   '접수', 'high',   '00000000-0000-0000-0000-000000000003', NULL, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'manual'),
  ('50000000-0000-0000-0000-000000000002', '리포트 다운로드 오류', 'CSV 다운로드 버튼 클릭 시 500 에러가 발생합니다.',
   '검토중', 'urgent', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'manual'),
  ('50000000-0000-0000-0000-000000000003', '생산계획 날짜 필터 버그', '시작일과 종료일 역전 시 빈 결과 대신 에러 메시지 없이 전체 데이터를 반환합니다.',
   '처리중', 'medium', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'manual'),
  ('50000000-0000-0000-0000-000000000004', '품질관리 기능 추가 요청', '불량 유형별 트렌드 차트 기능이 필요합니다.',
   '완료', 'low',    '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'manual'),
  ('50000000-0000-0000-0000-000000000005', '실적 데이터 오차 문의', '목표 대비 실적이 음수로 표시되는 경우가 있습니다.',
   '드랍', 'medium', '00000000-0000-0000-0000-000000000003', NULL, '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', 'manual'),
  ('50000000-0000-0000-0000-000000000006', '권한 오류 — 일반 사용자 관리자 메뉴 접근', '일반 사용자가 관리자 전용 설정 메뉴에 접근 가능합니다.',
   '접수', 'urgent', '00000000-0000-0000-0000-000000000003', NULL, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'manual'),
  ('50000000-0000-0000-0000-000000000007', '분석 리포트 필터 UI 개선', '현재 드롭다운 방식 필터를 멀티셀렉트로 변경 요청합니다.',
   '검토중', 'low',   '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'manual'),
  ('50000000-0000-0000-0000-000000000008', '생산계획 Jira 이관 데이터 정합성', 'Jira에서 이관된 VOC 중 담당자가 비어 있는 항목이 있습니다.',
   '처리중', 'high',  '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'import'),
  ('50000000-0000-0000-0000-000000000009', '대시보드 위젯 순서 저장 안 됨', '페이지 새로고침 후 위젯 순서가 초기화됩니다.',
   '완료', 'medium', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'manual'),
  ('50000000-0000-0000-0000-000000000010', '기타 — 로그인 후 리다이렉트 오류', '로그인 완료 후 이전 페이지가 아닌 홈으로 이동합니다.',
   '접수', 'medium', '00000000-0000-0000-0000-000000000003', NULL, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'manual')
ON CONFLICT (id) DO NOTHING;

-- comments (VOC당 1-2건)
INSERT INTO comments (id, voc_id, author_id, body) VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '담당자 배정 예정입니다. 내일까지 확인하겠습니다.'),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '서버 로그 확인 중입니다.'),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '재현 방법: 특정 날짜 범위에서만 발생하는 것 같습니다.'),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '수정 배포 예정일: 다음 스프린트'),
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '트렌드 차트 기능 v1.2에 포함 완료되었습니다.'),
  ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', '로컬스토리지 저장 로직 버그 수정 완료.'),
  ('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '멀티셀렉트 컴포넌트 라이브러리 검토 중입니다.')
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: 커밋**

```bash
git add backend/seeds/dev_seed.sql
git commit -m "feat(db): add dev_seed.sql (users, systems, menus, voc_types, tags, 10 vocs, comments)"
```

---

## Task 10: E2E 스모크 테스트

> 이 태스크는 Docker 환경에서 실행. `docker compose up` 이전에 모든 파일이 커밋되어 있어야 한다.

**Prerequisites:** PostgreSQL docker 컨테이너가 실행 중이거나 `docker compose up`으로 시작 가능한 상태.

- [ ] **Step 1: 기존 볼륨 초기화 (클린 슬레이트)**

```bash
cd /path/to/vocpage
docker compose down -v
```

Expected: postgres_data 볼륨 삭제 확인.

- [ ] **Step 2: docker compose up (백그라운드)**

```bash
docker compose up --build -d
```

- [ ] **Step 3: 마이그레이션 로그 확인**

```bash
docker compose logs backend | grep -E "migrate|error|Error" | head -20
```

Expected 포함 로그:

```
Migrating files: 001_extensions, 002_core_tables, 003_vocs, 004_tags, 005_content, 006_settings
```

`error` 라인이 없어야 한다.

- [ ] **Step 4: 테이블 존재 확인**

```bash
docker compose exec postgres psql -U vocpage -d vocpage -c "\dt"
```

Expected: 아래 테이블 목록이 모두 출력됨:

```
attachments, comments, dashboard_settings, faq_categories, faqs,
menus, notifications, notices, pgmigrations, systems, tag_rules, tags,
users, voc_history, voc_internal_notes, voc_payload_history, voc_payload_reviews,
voc_sequence_counters, voc_tags, voc_types, vocs
```

- [ ] **Step 5: 시드 실행 (호스트에서)**

```bash
# 호스트에서 직접 실행 (psql 필요) — 포트는 docker-compose.yml 확인
DATABASE_URL=postgres://vocpage:vocpage@localhost:5433/vocpage npm run --workspace=backend db:seed
```

또는 backend 컨테이너 내부에서:

```bash
docker compose exec backend sh -c "npm run db:seed"
```

Expected: 오류 없이 완료.

- [ ] **Step 6: 시드 데이터 확인**

```bash
docker compose exec postgres psql -U vocpage -d vocpage -c "
SELECT
  (SELECT count(*) FROM users)    AS users,
  (SELECT count(*) FROM systems)  AS systems,
  (SELECT count(*) FROM vocs)     AS vocs,
  (SELECT count(*) FROM comments) AS comments;
"
```

Expected:

```
 users | systems | vocs | comments
-------+---------+------+----------
     3 |       2 |   10 |        7
```

- [ ] **Step 7: sequence_no 트리거 확인**

```bash
docker compose exec postgres psql -U vocpage -d vocpage -c "
SELECT id, system_id, sequence_no FROM vocs ORDER BY system_id, sequence_no LIMIT 5;
"
```

Expected: `sequence_no` 컬럼이 NULL이 아니고 시스템별로 1부터 순차 채번됨.

- [ ] **Step 8: 최종 커밋**

```bash
git add .
git commit -m "feat(db): phase 6-7 DB migration and seed complete — smoke test passed"
```

---

## Self-Review 체크

**Spec 커버리지:**

- ✅ node-pg-migrate 설치 (Task 1)
- ✅ 6개 마이그레이션 파일 (Tasks 2-7)
- ✅ entrypoint.sh (Task 8)
- ✅ Dockerfile CMD 변경 (Task 8)
- ✅ dev_seed.sql (Task 9)
- ✅ sequence_no 트리거 (003_vocs.sql, Task 4)
- ✅ mock UUID 일치 검증 (dev_seed.sql)
- ✅ E2E 검증 (Task 10)

**미포함 (설계 명세 외):**

- HNSW 인덱스 — 임베딩 기능 도입 시 별도 마이그레이션
- issue_code — 미결 항목(🟠), 6-5 이후 결정
- 테스트 DB 전략 — 6-3에서 결정
