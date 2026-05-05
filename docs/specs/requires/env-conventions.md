# Environment Variable Conventions

**When to read:** 환경변수 추가·접근 방식·테스트 환경 설정 규칙이 필요할 때

> Frontend 환경변수 정본 문서.

---

## §18.1 파일 위치

```
frontend/src/shared/config/env.ts  ← import.meta.env 접근 유일 허용 위치
```

`shared/config/env.ts`는 **frontend 전용** (`import.meta.env`는 Vite-only).  
BE에서 import 불가 — 위치를 `frontend/src/shared/config/`로 명시.

---

## §18.2 구현 패턴

```ts
// frontend/src/shared/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
  VITE_ENABLE_MOCK: z.coerce.boolean().default(false),
  VITE_ENABLE_DEVTOOLS: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(`[env] 환경변수 설정 오류:\n${parsed.error.message}`);
}

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  appEnv: parsed.data.VITE_APP_ENV,
  enableMock: parsed.data.VITE_ENABLE_MOCK,
  enableDevtools: parsed.data.VITE_ENABLE_DEVTOOLS,
};
```

Zod `safeParse` 사용 — 모듈 import 시 즉시 throw (테스트 포함 전 환경 확인).

---

## §18.3 테스트 환경

`.env.test` 또는 `vitest.config.ts`의 `define`으로 필수 변수 설정.

```ts
// vitest.config.ts
define: {
  'import.meta.env.VITE_API_BASE_URL': '"http://localhost:4000"',
  'import.meta.env.VITE_APP_ENV': '"development"',
}
```

---

## §18.4 변수 목록

| 변수                   | 타입    | 필수 | 설명                                       |
| ---------------------- | ------- | ---- | ------------------------------------------ |
| `VITE_API_BASE_URL`    | string  | ✅   | API 서버 주소                              |
| `VITE_APP_ENV`         | enum    | ✅   | `development` \| `staging` \| `production` |
| `VITE_ENABLE_MOCK`     | boolean | —    | MSW mock 활성화 (기본 false)               |
| `VITE_ENABLE_DEVTOOLS` | boolean | —    | React Query Devtools (기본 false)          |

---

## §18.5 원칙

```
VITE_ prefix          필수 (Vite 노출 규칙)
import.meta.env       env.ts 외 접근 금지
boolean 값            'true'/'false' 문자열 아닌 Zod coerce 사용
.env.example          변수 추가/삭제 시 반드시 동기화
```
