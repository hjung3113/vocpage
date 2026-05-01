# Phase 8 OSS 도입 가이드 — 개방망 기본 + 폐쇄망 사후 재현 절차

> **운영 전제 (2026-05-01 갱신)**: Phase 8 Wave 0~5는 **개방망 환경에서 표준 npm registry로 진행**한다 (사내 폐쇄망 검증 환경 미확보). 폐쇄망 빌드는 동일 산출물(`package-lock.json` 고정 + 본 가이드)로 **사후 재현**하며, 그 절차/우회 경로를 본 절에 사전 정리해 둔다. 폐쇄망 적용 시점은 별도 phase에서 결정.
>
> **개방망 진행 중 지켜야 할 폐쇄망 호환 규칙** (now):
>
> - runtime fetch / telemetry / analytics 호출 OSS 금지 (build-time 번들만)
> - CDN URL을 산출물에 박지 않음 (`grep -r "cdn\|googleapis\|jsdelivr\|unpkg" frontend/dist` = 0)
> - 폰트/아이콘/MSW worker 모두 self-host (`frontend/public/`에 동봉)
> - `package-lock.json` 항상 commit, `npm ci` 결정성 유지

---

## §1. 개방망 (Wave 0~5 기본 경로)

```
npm config get registry          # https://registry.npmjs.org/
npm install <pkg>                # lockfile 갱신 → commit
npm ci                           # 재현 빌드 검증
```

> **Wave 0 implementation note (2026-05-01)**: 메이저 버전은 설치 시점 stable로 채택 — `zod@^4`, `sonner@^2`, `tailwind-merge@^3`, `lucide-react@^1.14`, `@tanstack/react-query@^5`, `msw@^2`. `phase-8.md §4` 표의 `^3 / ^1 / ^2 / ^0.4xx`는 계획 시점 표기, 실제 lockfile이 정본.

---

## §2. 폐쇄망 사후 재현 — 우회 옵션 우선순위

> 같은 `package-lock.json`을 폐쇄망에서 그대로 빌드할 수 있게 하는 4가지 경로. 위에서부터 시도.

| 우선순위 | 경로                         | 절차                                                                                                                                                                                                                                               | 비고                                                                                                                                                                      |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | **사내 npm 미러**            | `npm config set registry <internal>` 후 `npm ci`                                                                                                                                                                                                   | 가장 깔끔. 사내 IT에 미러 신청이 1차 권장 경로                                                                                                                            |
| 2        | **오프라인 캐시 번들**       | 개방망에서 `npm ci --prefer-offline` 후 `~/.npm/_cacache` 또는 `npm pack` 결과 묶음을 사내 반입 → `npm ci --offline --cache <반입경로>`                                                                                                            | lockfile 100% 일치 보장. 캐시 디렉토리 통째로 옮기는 게 가장 단순                                                                                                         |
| 3        | **Verdaccio proxy 캐시**     | 개방망에서 Verdaccio 띄워 `npm ci`로 캐시 적재 → `storage/` 디렉토리 사내 반입 → 사내에서 Verdaccio 기동, registry로 지정                                                                                                                          | 미러 신청이 막혔을 때 임시 사내 미러 역할. 라이선스 OK (MIT)                                                                                                              |
| 4        | **git tarball / `npm pack`** | (a) `package.json` 의존성을 `"<pkg>": "github:owner/repo#<tag>"` 또는 `git+https://…#<sha>` 로 교체 → 사내에서 git 접근 가능하면 그대로 설치 / (b) 외부에서 `npm pack <pkg>@<ver>` → `.tgz` 반입 → `npm install ./<pkg>.tgz` (또는 `file:` 의존성) | git tarball은 **lockfile integrity 해시가 git resolved로 바뀜**. PR description에 명시. `npm pack`은 transitive deps도 각각 `.tgz`로 받아야 해서 의존성 깊을수록 비현실적 |

**검토 결과 (git tarball 가능성)**:

- `npm install github:colinhacks/zod#v3.23.8` 같은 형태는 동작 (npm이 git clone 후 tarball 생성). 단 의존성 트리의 transitive까지 모두 git ref로 바꿔야 미러 없이 완결됨 → 의존성 수십 개 환경에서는 **비현실적**.
- 현실적 git tarball 활용: **shadcn/ui처럼 npm에 publish되지 않는 raw 소스**(Wave 0-2에서 코드 카피)와 **Pretendard 폰트 release** 두 케이스 한정. 그 외 라이브러리는 옵션 2(오프라인 캐시) 또는 옵션 1(사내 미러)이 우선.
- 결론: **우선순위 1 → 2 → 3 → 4 순. 옵션 4는 부분 의존성 또는 raw 소스 카피용 보조 수단**.

---

## §3. 미러/우회 경로 모두 부재 시 — 라이브러리별 raw 도입 절차

| 항목                                                          | 미러 없을 때                                                                                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **shadcn/ui 컴포넌트**                                        | npx 미사용. https://github.com/shadcn-ui/ui 의 `apps/www/registry/default/ui/<name>.tsx` 를 raw로 받아 `frontend/src/components/ui/`에 직접 커밋. 라이선스(MIT) LICENSE 파일도 같은 폴더에 보관        |
| **Lucide 아이콘**                                             | 미러가 있어야 정상. 부재 시 `lucide-react` 대신 사용하는 아이콘만 SVG로 직접 추출 → `frontend/src/components/ui/icons/`에 개별 컴포넌트                                                                |
| **Pretendard / D2Coding 폰트**                                | Google Fonts CDN 절대 금지. `pretendard` npm 패키지 또는 GitHub release `.woff2`를 받아 `frontend/public/fonts/`에 두고 `@font-face`로 self-host. 현재 로딩 경로가 CDN이면 즉시 교체 (Wave 0에서 점검) |
| **TanStack 라이브러리류, Zod, RHF, Recharts, Sonner, MSW 등** | 모두 표준 npm — 미러 없으면 사실상 작업 불가. 사내 미러 확보가 선결 조건. 임시로는 회사 정책 허용 시 외부 PC에서 `npm pack` 으로 tarball 추출 → 사내 반입 → `npm install ./<pkg>.tgz`                  |
| **MSW Service Worker 파일**                                   | `mockServiceWorker.js`는 npm 패키지 안에 동봉 — `npx msw init public/` 후 그대로 커밋. 외부 fetch 없음                                                                                                 |
| **shadcn CLI 스타일 빌더**                                    | CLI가 GitHub raw에서 코드를 fetch함. 사내에서 막히면 §2 1행대로 직접 커밋                                                                                                                              |
| **Recharts**                                                  | npm 표준. CDN 폴백 코드 없음 (확인됨)                                                                                                                                                                  |
| **Vite/Tailwind/Vitest**                                      | 이미 설치됨 — 추가 작업 없음                                                                                                                                                                           |

---

## §4. 추가 OSS 도입 시 사전 체크리스트

1. `package.json`의 `scripts.postinstall`이 외부로 ping 보내는지
2. 라이브러리가 런타임에 telemetry/analytics 엔드포인트를 호출하는지 (`grep -r "fetch\|XMLHttpRequest" node_modules/<pkg>/dist`)
3. 빌드 산출물에 외부 CDN URL이 포함되는지 (`grep -r "cdn\|googleapis\|jsdelivr\|unpkg" frontend/dist`)
4. 라이선스가 사내 OSS 정책과 호환되는지 (MIT/Apache/BSD 우선)

본 4 항목은 **새 라이브러리 추가 PR마다 description에 체크박스로 포함** (`.github/pull_request_template.md` 참조).

---

## 정본 동기화

본 문서(`docs/specs/plans/phase-8-oss-vendoring.md`)가 OSS 도입 가이드의 **단일 출처(Single Source of Truth)**다. `phase-8.md` §7은 본 문서를 참조하면 되며, 내용 갱신은 본 파일에서만 수행한다.
