# Phase 6-4 스캐폴딩 & 개발환경 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** npm workspaces 모노레포 뼈대를 만들고 ESLint/Prettier/Stylelint/husky/Docker Compose 개발환경을 구성해 `docker compose up`으로 FE+BE가 동시에 기동되는 상태를 만든다.

**Architecture:** 루트 `package.json`에 npm workspaces 선언, FE(`@vocpage/frontend`) + BE(`@vocpage/backend`) 서브패키지, 공통 ESLint 베이스를 각 서브패키지가 extends. Docker Compose는 루트 컨텍스트에서 두 Dockerfile을 빌드 (workspaces hoisting 때문에 node_modules가 루트에 있음).

**Tech Stack:** Node 22 LTS, npm workspaces, React 18 + Vite 5 + Tailwind CSS v4 (FE), Express 4 + ts-node-dev (BE), ESLint 8 + Prettier 3 + Stylelint 16 + husky 9 + lint-staged 15, Docker Compose v2

---

## 파일 맵

```
vocpage/
├── package.json                      ← Task 1: 생성
├── .nvmrc                            ← Task 1: 생성
├── .eslintrc.base.js                 ← Task 1: 생성
├── .prettierrc                       ← Task 1: 생성
├── .gitignore                        ← Task 9: 수정
├── .env.example                      ← Task 9: 생성
├── docker-compose.yml                ← Task 9: 생성
├── .husky/
│   └── pre-commit                    ← Task 7: 생성
├── frontend/
│   ├── package.json                  ← Task 2: 생성
│   ├── tsconfig.json                 ← Task 2: 생성
│   ├── vite.config.ts                ← Task 2: 생성
│   ├── index.html                    ← Task 2: 생성
│   ├── .eslintrc.js                  ← Task 5: 생성
│   ├── .stylelintrc.js               ← Task 5: 생성
│   └── src/
│       ├── main.tsx                  ← Task 2: 생성
│       ├── tokens.ts                 ← Task 2: 생성 (skeleton)
│       └── styles/
│           └── index.css             ← Task 2: 생성
└── backend/
    ├── package.json                  ← Task 3: 생성
    ├── tsconfig.json                 ← Task 3: 생성
    ├── .eslintrc.js                  ← Task 6: 생성
    └── src/
        └── index.ts                  ← Task 3: 생성
```

Dockerfile 위치:
- `frontend/Dockerfile` — Task 8
- `backend/Dockerfile` — Task 8

---

## Task 1: 루트 workspace 파일

**Files:**
- Create: `package.json`
- Create: `.nvmrc`
- Create: `.eslintrc.base.js`
- Create: `.prettierrc`

- [ ] **Step 1: `package.json` 작성**

```json
{
  "name": "vocpage",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w frontend\" \"npm run dev -w backend\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2",
    "prettier": "^3.2.5",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.7.1",
    "@typescript-eslint/parser": "^7.7.1",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-n": "^17.2.1",
    "stylelint": "^16.3.1",
    "stylelint-declaration-strict-value": "^1.9.2"
  },
  "lint-staged": {
    "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "**/*.{js,cjs,mjs}": ["prettier --write"],
    "**/*.{json,md}": ["prettier --write"],
    "**/*.{css,scss}": ["stylelint --fix", "prettier --write"]
  }
}
```

- [ ] **Step 2: `.nvmrc` 작성**

```
22
```

- [ ] **Step 3: `.eslintrc.base.js` 작성**

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
        // JS/TS 파일 내 hex 색상 리터럴 금지 — src/tokens.ts 사용 강제
        // 한계: 템플릿 리터럴 내 hex는 미검출 (Stylelint가 CSS에서 별도 커버)
        selector: "Literal[value=/#[0-9a-fA-F]{3,8}/]",
        message: 'Do not use hex color values directly. Import from src/tokens.ts instead.',
      },
    ],
  },
};
```

- [ ] **Step 4: `.prettierrc` 작성**

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

---

## Task 2: Frontend scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/tokens.ts`
- Create: `frontend/src/styles/index.css`

- [ ] **Step 1: `frontend/package.json` 작성**

```json
{
  "name": "@vocpage/frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.1",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.4.5",
    "vite": "^5.2.10",
    "vitest": "^1.5.0"
  }
}
```

- [ ] **Step 2: `frontend/tsconfig.json` 작성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: `frontend/vite.config.ts` 작성**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
  },
});
```

- [ ] **Step 4: `frontend/index.html` 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VOC 관리 시스템</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: `frontend/src/main.tsx` 작성**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

function App() {
  return <div className="p-4">VOC 관리 시스템</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 6: `frontend/src/tokens.ts` 작성 (skeleton)**

```ts
// Single source for design tokens.
// Feeds Tailwind @theme (via index.css) and CSS custom properties.
// Full values populated in Phase 6-9 (Prototype → Components).
// Never import hex values elsewhere — always go through this file.
export const tokens = {
  brand: 'oklch(56.5% 0.196 261.3)',
  accent: 'oklch(60% 0.15 200)',
  bgApp: 'oklch(14% 0.01 264)',
  textPrimary: 'oklch(95% 0.003 264.5)',
  textSecondary: 'oklch(65% 0.012 264)',
} as const;

export type TokenKey = keyof typeof tokens;
```

- [ ] **Step 7: `frontend/src/styles/index.css` 작성**

```css
@import 'tailwindcss';

/*
  @theme values mirror tokens.ts.
  In Phase 6-9, generate this block from tokens.ts via a build script.
  Until then, keep manually in sync.
*/
@theme {
  --color-brand: oklch(56.5% 0.196 261.3);
  --color-accent: oklch(60% 0.15 200);
  --color-bg-app: oklch(14% 0.01 264);
  --color-text-primary: oklch(95% 0.003 264.5);
  --color-text-secondary: oklch(65% 0.012 264);
}

:root {
  --bg-app: oklch(14% 0.01 264);
  --bg-panel: oklch(17% 0.01 264);
  --bg-surface: oklch(20% 0.012 264);
  --brand: oklch(56.5% 0.196 261.3);
  --text-primary: oklch(95% 0.003 264.5);
  --text-secondary: oklch(65% 0.012 264);
}

body {
  background-color: var(--bg-app);
  color: var(--text-primary);
}
```

---

## Task 3: Backend scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`

- [ ] **Step 1: `backend/package.json` 작성**

```json
{
  "name": "@vocpage/backend",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --runInBand",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.7",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: `backend/tsconfig.json` 작성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: `backend/src/index.ts` 작성**

```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
```

---

## Task 4: npm install & workspace 연결 확인

**Files:**
- Generated: `package-lock.json` (루트)

- [ ] **Step 1: 루트에서 `npm install` 실행**

```bash
npm install
```

Expected: `package-lock.json` 생성, `node_modules/` 루트에 설치됨.

- [ ] **Step 2: workspace 링크 확인**

```bash
npm ls --workspaces --depth=0
```

Expected output (excerpt):
```
vocpage@
├─┬ @vocpage/backend@0.0.1 -> ./backend
└─┬ @vocpage/frontend@0.0.1 -> ./frontend
```

- [ ] **Step 3: frontend dev 서버 기동 확인**

```bash
npm run dev -w frontend
```

Expected: Vite 서버가 `http://localhost:5173`에서 기동됨 (5초 내). `Ctrl+C`로 종료.

- [ ] **Step 4: backend dev 서버 기동 확인**

```bash
npm run dev -w backend
```

Expected: `Backend running on port 3000` 출력. 새 터미널에서:

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`. `Ctrl+C`로 종료.

- [ ] **Step 5: commit**

```bash
git add package.json package-lock.json .nvmrc .eslintrc.base.js .prettierrc \
  frontend/package.json frontend/tsconfig.json frontend/vite.config.ts \
  frontend/index.html frontend/src/ \
  backend/package.json backend/tsconfig.json backend/src/
git commit -m "chore: npm workspaces scaffold — FE(Vite+React) + BE(Express+ts-node-dev)"
```

---

## Task 5: Frontend ESLint + Stylelint

**Files:**
- Create: `frontend/.eslintrc.js`
- Create: `frontend/.stylelintrc.js`

- [ ] **Step 1: 위반 파일로 ESLint 실패 확인 (TDD)**

임시 파일 `frontend/src/_hex-test.ts` 작성:

```ts
const badColor = '#5e6ad2';
export { badColor };
```

실행:
```bash
npx eslint frontend/src/_hex-test.ts
```

Expected: 현재 `.eslintrc.base.js`만 있으므로 `no-restricted-syntax` 에러 발생. 이미 확인되면 Step 2로.

- [ ] **Step 2: `frontend/.eslintrc.js` 작성**

```js
module.exports = {
  extends: ['../.eslintrc.base.js', 'plugin:react-hooks/recommended'],
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/exhaustive-deps': 'error',
  },
};
```

- [ ] **Step 3: ESLint가 hex 리터럴을 잡는지 확인**

```bash
npx eslint frontend/src/_hex-test.ts
```

Expected: `Do not use hex color values directly` 에러 출력.

- [ ] **Step 4: Stylelint — 위반 CSS로 실패 확인**

임시 파일 `frontend/src/_style-test.css` 작성:

```css
.btn {
  color: #5e6ad2;
}
```

실행:
```bash
npx stylelint frontend/src/_style-test.css
```

Expected: `.stylelintrc.js`가 없으므로 규칙 없이 통과 (아직 설정 전). 확인 후 Step 5로.

- [ ] **Step 5: `frontend/.stylelintrc.js` 작성**

```js
module.exports = {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      ['color', 'background-color', 'border-color', 'fill', 'stroke'],
      { ignoreValues: ['transparent', 'inherit', 'currentColor'] },
    ],
  },
};
```

- [ ] **Step 6: Stylelint가 hex CSS를 잡는지 확인**

```bash
npx stylelint frontend/src/_style-test.css
```

Expected: `scale-unlimited/declaration-strict-value` 에러 출력. `Expected value "color" to be a variable...` 류의 메시지.

- [ ] **Step 7: 임시 파일 삭제 + commit**

```bash
rm frontend/src/_hex-test.ts frontend/src/_style-test.css
git add frontend/.eslintrc.js frontend/.stylelintrc.js
git commit -m "chore: frontend ESLint (react-hooks) + Stylelint (hex 금지)"
```

---

## Task 6: Backend ESLint

**Files:**
- Create: `backend/.eslintrc.js`

- [ ] **Step 1: 위반 파일로 any 에러 확인**

임시 파일 `backend/src/_any-test.ts` 작성:

```ts
const x: any = 'bad';
export { x };
```

실행:
```bash
npx eslint backend/src/_any-test.ts
```

Expected: `@typescript-eslint/no-explicit-any` 에러 (`no-explicit-any` from base).

- [ ] **Step 2: `backend/.eslintrc.js` 작성**

```js
module.exports = {
  extends: ['../.eslintrc.base.js', 'plugin:n/recommended'],
  plugins: ['n'],
  env: { node: true },
  rules: {
    'n/no-missing-require': 'off',   // TypeScript import 사용하므로 끔
    'n/no-unsupported-features/es-syntax': 'off', // TypeScript가 트랜스파일
  },
};
```

- [ ] **Step 3: backend/src/index.ts 타입 체크 통과 확인**

```bash
npm run typecheck -w backend
```

Expected: 에러 없음 (0 errors).

- [ ] **Step 4: 임시 파일 삭제 + commit**

```bash
rm backend/src/_any-test.ts
git add backend/.eslintrc.js
git commit -m "chore: backend ESLint (n/recommended)"
```

---

## Task 7: husky + lint-staged

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json` (prepare script 추가)

- [ ] **Step 1: husky 초기화**

```bash
npx husky init
```

Expected: `.husky/pre-commit` 파일 생성 (기본 내용: `npm test`).

- [ ] **Step 2: `package.json`에 `prepare` 스크립트 추가**

`package.json`의 `"scripts"` 블록에 추가:

```json
"prepare": "husky"
```

최종 scripts:
```json
"scripts": {
  "dev": "concurrently \"npm run dev -w frontend\" \"npm run dev -w backend\"",
  "prepare": "husky"
}
```

- [ ] **Step 3: `.husky/pre-commit` 덮어쓰기**

```bash
cat > .husky/pre-commit << 'EOF'
npx lint-staged
npm run typecheck -w frontend
npm run typecheck -w backend
EOF
```

- [ ] **Step 4: pre-commit hook 동작 확인 (hex 파일 커밋 시도)**

```bash
# hex 리터럴 있는 임시 파일 생성
echo "const c = '#5e6ad2'; export { c };" > frontend/src/_hook-test.ts
git add frontend/src/_hook-test.ts
git commit -m "test: should be blocked"
```

Expected: lint-staged가 ESLint를 실행 → `no-restricted-syntax` 에러로 커밋 **차단**. 아래 류의 메시지:

```
✖ eslint --fix:
  frontend/src/_hook-test.ts
    1:11  error  Do not use hex color values directly...
```

- [ ] **Step 5: 임시 파일 unstage + 삭제**

```bash
git restore --staged frontend/src/_hook-test.ts
rm frontend/src/_hook-test.ts
```

- [ ] **Step 6: 정상 파일로 커밋 통과 확인**

```bash
# 기존 파일에 공백 한 줄 추가해 staged 변경 만들기
echo "" >> frontend/.eslintrc.js
git add frontend/.eslintrc.js
git commit -m "test: hook smoke test — should pass"
```

Expected: lint-staged + tsc 전부 통과 → 커밋 성공.

```bash
# 테스트 커밋 즉시 되돌리기 (커밋 기록 남기지 않음)
git reset HEAD~1 --mixed
git restore frontend/.eslintrc.js
```

- [ ] **Step 7: commit**

```bash
git add .husky/pre-commit package.json
git commit -m "chore: husky pre-commit — lint-staged + tsc typecheck"
```

---

## Task 8: Dockerfiles

**Files:**
- Create: `frontend/Dockerfile`
- Create: `backend/Dockerfile`

- [ ] **Step 1: `frontend/Dockerfile` 작성**

```dockerfile
FROM node:22-alpine AS development

WORKDIR /app

# workspace manifest 먼저 복사 (npm ci layer cache 최적화)
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# 루트에서 설치 (workspaces hoisting)
RUN npm ci

# 소스 복사
COPY frontend/ ./frontend/

WORKDIR /app/frontend
EXPOSE 5173

CMD ["npm", "run", "dev"]
```

- [ ] **Step 2: `backend/Dockerfile` 작성**

```dockerfile
FROM node:22-alpine AS development

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
EXPOSE 3000

CMD ["npm", "run", "dev"]
```

---

## Task 9: docker-compose.yml + .env.example + .gitignore

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: `docker-compose.yml` 작성**

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      AUTH_MODE: ${AUTH_MODE}
      MSSQL_HOST: ${MSSQL_HOST}
      MSSQL_USER: ${MSSQL_USER}
      MSSQL_PASSWORD: ${MSSQL_PASSWORD}
      MSSQL_DATABASE: ${MSSQL_DATABASE}
      SESSION_SECRET: ${SESSION_SECRET}
    ports:
      - "3000:3000"
    volumes:
      - uploads_data:/app/backend/uploads
      - ./backend/src:/app/backend/src   # hot reload
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/frontend/src   # hot reload
    depends_on:
      - backend

volumes:
  postgres_data:
  uploads_data:
```

- [ ] **Step 2: `.env.example` 작성**

```bash
# ── PostgreSQL ───────────────────────────────────────────────────────────────
DB_NAME=vocpage
DB_USER=vocpage
DB_PASSWORD=changeme
DATABASE_URL=postgresql://vocpage:changeme@postgres:5432/vocpage

# ── Auth ─────────────────────────────────────────────────────────────────────
# mock: AD 없이 고정 유저로 동작 (개발용)
# oidc: 실제 AD/LDAP 연결 (운영용)
AUTH_MODE=mock
SESSION_SECRET=dev-secret-change-in-prod

# ── MSSQL (외부 마스터 캐시 — 7A 전략) ────────────────────────────────────────
# 설비/DB/프로그램 마스터 원천 시스템. 읽기 전용.
# 개발 시 빈 값이면 마스터 캐시 없이 기동 (디스크 스냅샷 fallback 모드)
MSSQL_HOST=
MSSQL_USER=
MSSQL_PASSWORD=
MSSQL_DATABASE=

# ── Frontend ─────────────────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3000

# ── 추후 추가 예정 ────────────────────────────────────────────────────────────
# SESSION_STORE_URL=  (6-6 인증 Mock 전략 확정 후)
# CORS_ORIGIN=        (6-5 FE-BE API 계약 확정 후)
```

- [ ] **Step 3: `.gitignore` 확인 및 항목 추가**

기존 `.gitignore`에 아래 항목이 없으면 추가:

```gitignore
# 환경변수
.env
.env.local
.env.*.local

# 빌드 결과물
dist/
build/

# 업로드 파일
uploads/

# 로그
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

- [ ] **Step 4: `.env` 복사 (로컬 개발용)**

```bash
cp .env.example .env
```

`.env`는 gitignore됨 — 커밋하지 않는다.

- [ ] **Step 5: commit**

```bash
git add docker-compose.yml .env.example .gitignore frontend/Dockerfile backend/Dockerfile
git commit -m "chore: Docker Compose dev setup + Dockerfiles + .env.example"
```

---

## Task 10: End-to-End 스모크 테스트

- [ ] **Step 1: Docker Compose 빌드 & 기동**

```bash
docker compose up --build -d
```

Expected: 이미지 빌드 후 3개 컨테이너(postgres, backend, frontend) 기동. 처음에는 npm ci 실행으로 1-2분 소요.

- [ ] **Step 2: 컨테이너 상태 확인**

```bash
docker compose ps
```

Expected:
```
NAME                STATUS
vocpage-postgres-1  Up (healthy)
vocpage-backend-1   Up
vocpage-frontend-1  Up
```

- [ ] **Step 3: BE health 엔드포인트 확인**

```bash
curl http://localhost:3000/health
```

Expected:
```json
{"status":"ok","timestamp":"..."}
```

- [ ] **Step 4: FE 기동 확인**

브라우저에서 `http://localhost:5173` 열기. "VOC 관리 시스템" 텍스트가 표시되면 성공.

- [ ] **Step 5: 컨테이너 종료**

```bash
docker compose down
```

- [ ] **Step 6: PR 생성**

```bash
git push -u origin docs/phase6-4-scaffolding-design
```

PR 제목: `feat: Phase 6-4 스캐폴딩 — npm workspaces + linting + Docker Compose dev`
PR body: 설계 문서 `docs/specs/plans/phase6-4-scaffolding-design.md` 링크 포함.

---

## 완료 조건 체크리스트

- [ ] `npm install` (루트) 성공
- [ ] `npm run dev` (루트) 로 FE+BE 동시 기동
- [ ] ESLint: hex 리터럴 사용 시 에러
- [ ] Stylelint: CSS에서 `color: #hex` 사용 시 에러
- [ ] husky pre-commit: hex 파일 커밋 시 차단됨
- [ ] `tsc --noEmit` FE + BE 모두 통과
- [ ] `docker compose up` 으로 FE+BE+Postgres 기동
- [ ] `GET /health` → `{"status":"ok"}`
- [ ] `.env.example` 커밋됨, `.env` gitignore됨
