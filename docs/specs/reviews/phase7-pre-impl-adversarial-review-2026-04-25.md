# Phase 7 착수 전 적대적 리뷰 — 코드 대조 검증

**날짜**: 2026-04-25  
**기준**: main 브랜치 (Phase 6 착수내용 완료 상태)  
**대상**: prototype 제외 전체 (backend, frontend, shared, docs/specs)  
**방법**: Codex adversarial-review → 실제 파일 대조 수동 검증

---

## 결론

Phase 7 착수 전 **4개의 high/critical 결함**이 실제 코드에서 확인됐다.
이 중 2개(seed 드리프트, VOC 스키마 불일치)는 즉시 수정 가능하고,
2개(Vite 프록시 누락, session 퍼시스턴스 미구현)는 구조적 수정이 필요하다.
설비 마스터 TBD는 스펙에서 이미 인식하고 stub 전략을 선택한 의도적 결정이므로 별도 조치 불필요.

---

## 확인된 결함

### F-1 [critical] seed 파일 컬럼명 드리프트

**파일**: `backend/seeds/dev_seed.sql:49`, `backend/migrations/003_vocs.sql:44`

마이그레이션은 `vocs.author_id`를 정의하지만 시드는 여전히 `reporter_id`로 INSERT.
`npm run db:seed` 실행 시 즉시 실패 — 개발 환경에서 샘플 데이터를 전혀 올릴 수 없다.

```sql
-- migrations/003_vocs.sql:44
author_id uuid NOT NULL REFERENCES users(id),

-- seeds/dev_seed.sql:49  ← 버그
INSERT INTO vocs (id, title, body, status, priority, reporter_id, ...)
```

**수정**: `dev_seed.sql:49` `reporter_id` → `author_id` 변경.

---

### F-2 [high] Frontend `/api` 요청이 백엔드에 도달하지 못함

**파일**: `frontend/src/api/auth.ts:11,23,27`, `frontend/vite.config.ts`

클라이언트 코드가 상대경로 `/api/...`로 fetch하는데 Vite config에 `/api` 프록시가 없다.
로컬 dev 환경에서 브라우저는 Vite dev server(5173)에 `/api`를 요청 → 404.
Docker는 백엔드를 `3001:3000`으로 매핑하고, `.env.example`에 `VITE_API_BASE_URL=http://localhost:3000`이 있지만 클라이언트 코드에서 미사용.

```ts
// frontend/src/api/auth.ts
const res = await fetch('/api/auth/mock-login', { ... }); // 프록시 없으면 5173으로 감

// frontend/vite.config.ts — proxy 설정 없음
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
  // ...
});
```

**선택지** (둘 중 하나로 통일):

- **A) Vite 프록시**: `vite.config.ts`에 `server.proxy: { '/api': 'http://localhost:3001' }` 추가 (Docker 호스트 포트 기준)
- **B) 환경변수 기반**: `VITE_API_BASE_URL`을 클라이언트가 prefix로 사용, `backend/src/index.ts` CORS에 `credentials: true` 추가

---

### F-3 [high] AUTH_MODE=oidc 허용하지만 protected 라우트는 mock에 하드와이어

**파일**: `backend/src/index.ts:11`, `backend/src/routes/auth.ts:2,30`

`createAuthMiddleware()`의 반환값이 버려지고, `/api/auth/me`는 `mockAuthMiddleware`로 고정.
`AUTH_MODE=oidc`로 기동해도 실제 OIDC 검증 없이 모든 요청이 mock 세션을 통과한다.

```ts
// backend/src/index.ts:11
createAuthMiddleware(); // 반환값 버림 — 미들웨어가 라우트에 적용되지 않음

// backend/src/routes/auth.ts:30
authRouter.get('/me', mockAuthMiddleware, ...); // AUTH_MODE 무관하게 항상 mock
```

**수정**:

- `createAuthMiddleware()` 반환값을 변수에 저장해 protected 라우트에 적용
- 또는 OIDC 구현 전까지 `AUTH_MODE=oidc` 설정 시 기동 자체를 실패시킴
- `oidcAuthMiddleware`가 stub(throwing) 상태임을 명시적으로 문서화

---

### F-4 [high] production 환경에서도 MemoryStore 사용 (connect-pg-simple 미구현)

**파일**: `backend/src/index.ts:25-35`, `backend/package.json`

스펙과 Docker 환경변수는 `SESSION_STORE_URL`을 통한 `connect-pg-simple` 사용을 가정하지만,
실제 코드는 `store` 옵션 없이 `express-session`을 초기화 — 모든 환경에서 MemoryStore.

```ts
// backend/src/index.ts
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    // store: 없음 → MemoryStore (production 재시작 시 세션 전체 소실)
    cookie: { ... },
  }),
);
```

`backend/package.json`에도 `connect-pg-simple` 의존성 없음.

**수정**:

- `NODE_ENV=production`일 때 `connect-pg-simple` store 적용
- `SESSION_STORE_URL` 없으면 production 기동 실패
- production에서 MemoryStore 감지 시 startup assertion

---

### F-5 [high] VOC 스키마 필드명이 OpenAPI 계약과 불일치

**파일**: `backend/migrations/003_vocs.sql:48-49`, `shared/openapi.yaml:1990,2057,2086`

마이그레이션은 `voc_type_id`(nullable)를 정의하지만 OpenAPI는 `type_id`를 노출.
`menu_id`도 마이그레이션에서 nullable이지만 요구사항은 필수 필드로 정의.

```sql
-- migrations/003_vocs.sql
menu_id     uuid REFERENCES menus(id),      -- nullable
voc_type_id uuid REFERENCES voc_types(id),  -- nullable
```

```yaml
# shared/openapi.yaml — type_id 사용 (voc_type_id 아님)
type_id:
  type: string
  format: uuid
```

API 핸들러가 이 계약을 기반으로 생성되면 존재하지 않는 컬럼(`type_id`)에 쓰거나,
스펙이 필수라고 말하는 필드를 null로 허용하게 된다.

**수정**: 요구사항 → OpenAPI → 생성 타입 → 마이그레이션 → 시드 전체에서
`type_id` vs `voc_type_id` 통일 및 NOT NULL 제약 결정 후 일관 적용.

---

## 의도적 결정 (결함 아님)

### D-1 설비 마스터 MSSQL 스키마 TBD

**파일**: `docs/specs/requires/external-masters.md:43-46`

외부 마스터 스펙에서 이미 인식하고 stub 전략(`config/masters/equipment-stub.json`)을 명시.
로더 함수 1개만 교체하면 되는 격리 구조로 설계됐으므로 추가 조치 불필요.
단, stub 기반으로 `unverified_fields` 검증 로직을 구현할 때 실제 MSSQL collation/case 규칙을 가정하지 않도록 주의.

---

## 수정 우선순위

| 순서 | 결함                    | 작업량                    | Phase 7 착수 전 필수?   |
| ---- | ----------------------- | ------------------------- | ----------------------- |
| 1    | F-1 seed 드리프트       | 1줄                       | 필수                    |
| 2    | F-5 VOC 스키마 불일치   | 마이그레이션+OpenAPI+타입 | 필수                    |
| 3    | F-2 Vite 프록시 누락    | vite.config 1~5줄         | 필수 (개발 불가)        |
| 4    | F-3 AUTH_MODE 신뢰 경계 | auth 라우트 재배선        | 권장                    |
| 5    | F-4 MemoryStore         | connect-pg-simple 추가    | production 배포 전 필수 |

F-1, F-5, F-2는 VOC CRUD 핸들러 구현 전에 반드시 수정.
F-3은 OIDC stub 상태가 외부에 노출되지 않도록 경계 명확화.
F-4는 Phase 7 범위 내 production 배포가 없으면 Phase 8로 미룰 수 있음.
