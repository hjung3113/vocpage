# Phase 6-4 스캐폴딩 & 개발환경 설계

> 작성일: 2026-04-24
> 상태: 설계 확정 (brainstorming 완료)
> 다음 단계: 구현 계획 (`writing-plans` 스킬로 이관)

---

## 1. 핵심 결정 요약

| 결정 항목 | 선택 | 근거 |
|---|---|---|
| 모노레포 구조 | **npm workspaces** | `shared/` 패키지(6-5 OpenAPI codegen) 추가 시 자연스러운 확장 경로 |
| `.env` 구조 | **루트 단일 `.env`** | Docker Compose 자동 인식, `VITE_` prefix로 FE/BE 구분 |
| pre-commit hook | **lint-staged + tsc** | 타입 오류는 커밋 시점 차단이 CI보다 비용 낮음 |
| 스캐폴딩 범위 | **균형 (B안)** | `shared/`·CI는 YAGNI — 6-5·Phase 7에서 추가 |

---

## 2. 디렉토리 구조

```
vocpage/
├── package.json            ← 루트: workspaces 선언, husky, lint-staged, concurrently
├── .nvmrc                  ← Node 22 LTS 고정
├── .env                    ← gitignore (실제 시크릿)
├── .env.example            ← 커밋됨 (온보딩 기준)
├── .eslintrc.base.js       ← FE/BE 공통 ESLint 규칙
├── .prettierrc             ← 공통 Prettier
├── docker-compose.yml
├── frontend/
│   ├── package.json        ← "name": "@vocpage/frontend"
│   ├── .eslintrc.js        ← extends .eslintrc.base.js + React/hooks 규칙
│   └── .stylelintrc.js     ← stylelint-declaration-strict-value (hex 금지)
├── backend/
│   ├── package.json        ← "name": "@vocpage/backend"
│   └── .eslintrc.js        ← extends .eslintrc.base.js + Node 규칙
└── prototype/              ← 기존 유지 (workspaces 미포함)
```

`shared/`는 6-5(OpenAPI codegen) 시점에 workspaces 배열에 추가한다.

---

## 3. 루트 `package.json`

```json
{
  "name": "vocpage",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w frontend\" \"npm run dev -w backend\""
  },
  "devDependencies": {
    "concurrently": "^8",
    "husky": "^9",
    "lint-staged": "^15",
    "prettier": "^3",
    "eslint": "^8",
    "@typescript-eslint/eslint-plugin": "^7",
    "@typescript-eslint/parser": "^7"
  },
  "lint-staged": {
    "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "**/*.{js,json,md}": ["prettier --write"],
    "**/*.{css,scss}": ["stylelint --fix", "prettier --write"]
  }
}
```

---

## 4. ESLint / Prettier / Stylelint

### 4.1 공통 베이스 (`.eslintrc.base.js`)

```js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-restricted-syntax': [
      'error',
      {
        // JS/TS 파일 내 hex 리터럴 금지 — tokens.ts 사용 강제
        selector: "Literal[value=/#[0-9a-fA-F]{3,8}/]",
        message: 'Do not use hex values directly. Import from src/tokens.ts instead.'
      }
    ]
  }
}
```

### 4.2 FE (`frontend/.eslintrc.js`)

```js
module.exports = {
  extends: ['../.eslintrc.base.js', 'plugin:react-hooks/recommended'],
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/exhaustive-deps': 'error'
  }
}
```

### 4.3 BE (`backend/.eslintrc.js`)

```js
module.exports = {
  extends: ['../.eslintrc.base.js', 'plugin:node/recommended'],
  plugins: ['node'],
  env: { node: true }
}
```

### 4.4 Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

### 4.5 Stylelint (`frontend/.stylelintrc.js`) — hex 금지

```js
module.exports = {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      ['color', 'background-color', 'border-color', 'fill', 'stroke'],
      { ignoreValues: ['transparent', 'inherit', 'currentColor'] }
    ]
  }
}
```

---

## 5. husky pre-commit

```
pre-commit 순서:
1. lint-staged  — 변경 파일만 ESLint --fix + Prettier --write + Stylelint --fix
2. tsc --noEmit — frontend + backend 각각 타입 체크
```

tsc 오류가 있으면 커밋 차단. `--no-verify` 우회 금지 (root CLAUDE.md 규칙).

---

## 6. Docker Compose

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  backend:
    build:
      context: .                        # 루트 기준 (workspaces node_modules hoisting)
      dockerfile: backend/Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: ${DATABASE_URL}
      AUTH_MODE: ${AUTH_MODE}           # mock | oidc
      MSSQL_HOST: ${MSSQL_HOST}
      MSSQL_USER: ${MSSQL_USER}
      MSSQL_PASSWORD: ${MSSQL_PASSWORD}
      MSSQL_DATABASE: ${MSSQL_DATABASE}
      SESSION_SECRET: ${SESSION_SECRET}
    ports: ["3000:3000"]
    volumes: [uploads_data:/app/uploads]
    depends_on: [postgres]

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    ports: ["5173:5173"]
    depends_on: [backend]

volumes:
  postgres_data:
  uploads_data:
```

**핵심**: `build.context: .` (루트) — workspaces hoisting으로 `node_modules`가 루트에 있으므로 FE/BE Dockerfile 모두 루트 컨텍스트에서 실행해야 한다.

---

## 7. `.env.example`

```bash
# ── PostgreSQL ────────────────────────────────────────────
DB_NAME=vocpage
DB_USER=vocpage
DB_PASSWORD=changeme
DATABASE_URL=postgresql://vocpage:changeme@postgres:5432/vocpage

# ── Auth ─────────────────────────────────────────────────
AUTH_MODE=mock          # mock | oidc
SESSION_SECRET=dev-secret-change-in-prod

# ── MSSQL (외부 마스터 캐시, 7A 전략) ──────────────────────
MSSQL_HOST=
MSSQL_USER=
MSSQL_PASSWORD=
MSSQL_DATABASE=

# ── Frontend ─────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3000
```

추후 추가 예정 (결정 시점에 반영):
- `SESSION_STORE_URL` — 6-6 인증 Mock 전략 확정 후
- `CORS_ORIGIN` — 6-5 FE-BE API 계약 확정 후
- `OPENAI_API_KEY` 등 AI 관련 — NextGen 진입 시

---

## 8. 미결 사항 (이 설계에서 결정하지 않은 것)

| 항목 | 결정 시점 |
|---|---|
| 세션 스토어 (`express-session` store) | 6-6 |
| CORS 정책 (Vite proxy vs BE cors()) | 6-5 |
| `issue_code` prefix 방식 | 6-5 or 6-7 |
| `shared/` 패키지 구조 | 6-5 (OpenAPI codegen) |
| Docker multi-stage build (prod) | Phase 7 직전 |
| GitHub Actions CI | Phase 7 직전 |
