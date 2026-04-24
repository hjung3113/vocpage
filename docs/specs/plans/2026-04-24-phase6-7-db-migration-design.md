# Phase 6-7: DB 마이그레이션 & 시드 전략

> 작성일: 2026-04-24
> 상태: 설계 확정 — 구현 대기

## 결정 요약

| 항목              | 결정                                                     |
| ----------------- | -------------------------------------------------------- |
| 마이그레이션 도구 | **node-pg-migrate** (이미 확정, next-session-tasks.md)   |
| 실행 시점         | **자동** — BE Docker entrypoint에서 migrate → dev 순서   |
| 파일 구조         | **도메인별 분리 (6파일)**                                |
| 시드 전략         | **별도 스크립트** — `npm run db:seed` 최초 1회 수동 실행 |
| 테스트 DB         | **6-3에서 결정** — 지금 스코프 외                        |

---

## 파일 구조

```
backend/
├── migrations/
│   ├── 001_extensions.sql        pgvector CREATE EXTENSION
│   ├── 002_core_tables.sql       users, systems, menus, voc_types
│   ├── 003_vocs.sql              vocs, voc_history, voc_payload_reviews, voc_payload_history
│   ├── 004_tags.sql              tags, voc_tags, tag_rules
│   ├── 005_content.sql           comments, voc_internal_notes, attachments, notices, faq_categories, faqs
│   └── 006_settings.sql          dashboard_settings, notifications
├── seeds/
│   └── dev_seed.sql              개발용 초기 데이터
├── entrypoint.sh                 migrate → npm run dev
└── src/
    └── (기존 코드 변경 없음)
```

`pgmigrations` 테이블은 node-pg-migrate가 자동 생성 — 어떤 파일까지 실행됐는지 추적.

---

## npm 스크립트

`backend/package.json`에 추가:

```json
"db:migrate": "node-pg-migrate up -m migrations",
"db:migrate:down": "node-pg-migrate down -m migrations",
"db:seed": "psql $DATABASE_URL -f seeds/dev_seed.sql"
```

---

## entrypoint.sh

```sh
#!/bin/sh
set -e
npm run db:migrate
exec npm run dev
```

---

## Dockerfile 변경

```dockerfile
# 기존 마지막 줄
CMD ["npm", "run", "dev"]

# 변경 후
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
CMD ["/app/entrypoint.sh"]
```

---

## 실행 흐름

```
docker compose up
  └── postgres healthy 대기 (depends_on: service_healthy — 이미 설정됨)
  └── BE 컨테이너 시작
      └── entrypoint.sh
          ├── npm run db:migrate
          │   └── pgmigrations 체크 → 미실행 파일만 순서대로 실행
          └── npm run dev (Express 서버 시작)

# 최초 1회 (개발자 수동)
npm run db:seed
```

---

## 마이그레이션 파일별 테이블 매핑

### 001_extensions.sql

- `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- `CREATE EXTENSION IF NOT EXISTS vector;`

### 002_core_tables.sql

- `users` — id(uuid), ad_username, display_name, email, role CHECK('user','manager','admin'), is_active bool, created_at
- `systems` — id(uuid), name, slug(UNIQUE), is_archived bool
- `menus` — id(uuid), system_id(FK→systems), name, slug, is_archived. (system_id, slug) UNIQUE
- `voc_types` — id(uuid), name, slug(UNIQUE), color(text), sort_order int, is_archived bool

### 003_vocs.sql

- `vocs` — 전체 컬럼 (requirements.md §4 기준)
  - embedding vector(1536) NULL — MVP 미사용, pgvector 예약
  - structured_payload jsonb NULL
  - structured_payload_draft jsonb NULL
  - review_status text CHECK('unverified','approved','rejected','pending_deletion') NULL
  - embed_stale boolean DEFAULT false
  - resolution_quality text CHECK('근본해결','임시조치') NULL
  - drop_reason text CHECK('중복','정책거부','재현불가','범위외','기타') NULL
  - source text NOT NULL DEFAULT 'manual' CHECK('manual','import')
  - deleted_at, created_at, updated_at
- `voc_history` — id(uuid), voc_id(FK→vocs CASCADE), field, old_value, new_value, changed_by(FK→users), changed_at
- `voc_payload_reviews` — id(uuid), voc_id(FK→vocs CASCADE), action CHECK('submission','deletion'), reviewer_id(FK→users), decision CHECK('approved','rejected'), comment text, is_self_review bool DEFAULT false, created_at
- `voc_payload_history` — id(uuid), voc_id(FK→vocs CASCADE), payload jsonb NOT NULL, submitted_by(FK→users), submitted_at, final_state CHECK('approved','rejected','deleted','active'), is_current bool DEFAULT false

### 004_tags.sql

- `tags` — id(uuid), name, slug(UNIQUE), kind text CHECK('general','menu'), created_at
- `voc_tags` — voc_id(FK→vocs CASCADE), tag_id(FK→tags CASCADE), source text NOT NULL DEFAULT 'manual' CHECK('manual','rule'), created_at. PK: (voc_id, tag_id)
- `tag_rules` — id(uuid), name, pattern text, kind text CHECK('general'), tag_id(FK→tags), is_active bool DEFAULT true, sort_order int, created_at

### 005_content.sql

- `comments` — id(uuid), voc_id(FK→vocs CASCADE), author_id(FK→users), body text NOT NULL, created_at, updated_at
- `voc_internal_notes` — id(bigserial), voc_id(FK→vocs CASCADE), author_id(FK→users), body text NOT NULL, created_at, updated_at, deleted_at NULL
- `attachments` — id(uuid), voc_id(FK→vocs CASCADE), uploader_id(FK→users), filename text, mime_type text, size_bytes int, storage_path text, created_at
- `notices` — id(uuid), title, body text, level text CHECK('normal','important','urgent'), is_popup bool, is_visible bool, visible_from date NULL, visible_to date NULL, author_id(FK→users), deleted_at NULL, created_at, updated_at
- `faq_categories` — id(uuid), name, slug(UNIQUE), sort_order int, is_archived bool
- `faqs` — id(uuid), question text, answer text, category_id(FK→faq_categories), is_visible bool, sort_order int, author_id(FK→users), deleted_at NULL, created_at, updated_at

### 006_settings.sql

- `dashboard_settings` — id(uuid), user_id(FK→users NULL=Admin 기본값), widget_order jsonb, widget_visibility jsonb, widget_sizes jsonb, default_date_range text CHECK('7d','30d','90d','custom'), heatmap_default_x_axis text CHECK('status','priority','tag'), locked_fields jsonb, updated_at. UNIQUE(user_id)
- `notifications` — id(uuid), user_id(FK→users), type text CHECK('comment','status_change','assigned'), voc_id(FK→vocs), read_at timestamptz NULL, created_at

---

## 시드 데이터 (dev_seed.sql)

`INSERT ... ON CONFLICT DO NOTHING` — 재실행 안전.

| 테이블      | 내용                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------ |
| `users`     | 3명 — UUID는 6-6 mock fixtures와 동일 (`...0001`=admin, `...0002`=manager, `...0003`=user) |
| `systems`   | "분석 시스템", "생산관리 시스템"                                                           |
| `menus`     | 각 시스템당 3–4개 ("기타" 포함)                                                            |
| `voc_types` | 버그(빨강), 기능 요청(파랑), 개선 제안(초록), 문의(회색)                                   |
| `tags`      | general 5개, menu 2개                                                                      |
| `vocs`      | 10건 — status·priority 다양하게 분포 (대시보드 위젯이 유의미하게 보이도록)                 |
| `comments`  | VOC당 1–2건                                                                                |

---

## 기술부채 & 연계 사항

| 항목                                              | 처리 시점                                  |
| ------------------------------------------------- | ------------------------------------------ |
| HNSW 인덱스 (`vector_cosine_ops`)                 | 임베딩 기능 도입 시 별도 마이그레이션      |
| `sequence_no` 채번 로직 (시스템·연도 단위 unique) | 003_vocs.sql에서 시퀀스 또는 트리거로 구현 |
| 테스트 DB 전략                                    | **6-3 BE 테스트 전략**에서 결정            |
| `ts-node-dev` → `tsx` 교체                        | 6-6 이전 또는 6-7 (PR #14 defer 목록)      |
