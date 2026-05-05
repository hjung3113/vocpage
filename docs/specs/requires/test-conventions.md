# Test / Mock Conventions

**When to read:** 테스트 방식 결정(unit·integration·e2e), MSW 설정, fixture 위치 규칙이 필요할 때

> Frontend 테스트·Mock 정본 문서.

---

## §17.1 테스트 우선순위

| 대상                       | 방식             | 도구         |
| -------------------------- | ---------------- | ------------ |
| 유틸 함수 (`shared/lib/*`) | unit test        | Vitest       |
| 권한/상태 전환 순수 로직   | unit test        | Vitest       |
| 폼 validation schema (Zod) | unit test        | Vitest       |
| API contract (Zod parse)   | schema test      | Vitest       |
| 핵심 화면 (JSX 포함)       | integration test | Vitest + RTL |
| E2E 핵심 플로우            | e2e test         | Playwright   |

"권한/상태 전환" unit test 범위: JSX 없는 순수 함수/guard만.  
JSX 포함(컴포넌트 렌더·인터랙션)은 integration test.

---

## §17.2 Fixture 위치 기준

| 위치                   | 용도                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `shared/fixtures/`     | FE+BE 공용 — BE seed parity 필요한 데이터 (`check-fixture-seed-parity.ts` 검증 대상) |
| `test/mocks/fixtures/` | FE 전용 — UI edge case, BE parity 불필요                                             |

fixture factory 패턴 필수:

```ts
// test/mocks/fixtures/voc.fixture.ts
export function createVocFixture(overrides?: Partial<Voc>): Voc {
  return { id: 'voc-1', status: 'OPEN', ...overrides };
}
```

---

## §17.3 MSW Mock 구조

```
test/mocks/
├─ handlers/
│  ├─ voc.handler.ts
│  ├─ auth.handler.ts
│  ├─ master.handler.ts
│  └─ index.ts
├─ fixtures/
│  ├─ voc.fixture.ts
│  └─ user.fixture.ts
└─ server.ts
```

---

## §17.4 MSW 서버 설정

```ts
// test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// test/setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` 필수 — 핸들러 누락 시 테스트 즉시 실패.

---

## §17.5 테스트 파일 위치

```
원본 파일과 같은 폴더 또는 __tests__/ 하위 (프로젝트 기존 패턴 유지)
파일명: 원본파일명.test.ts(x)
```

---

## §17.6 원칙

```
shared/fixtures   BE seed parity 필요 데이터만 (parity script 자동 검증)
MSW handler       onUnhandledRequest: 'error' 필수
fixture factory   createXxxFixture(overrides?) 패턴 필수
단위 테스트 범위  순수 함수만 (JSX 포함 시 integration으로 분류)
```
