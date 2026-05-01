# Phase 8 — Mirror Check (Wave 0-0)

> **Phase 8 Wave 0 첫 commit 산출물**. 운영 전제는 `phase-8.md` §7과 `next-session-tasks.md` 상단 운영 전제 라인을 정본으로 한다.
> **작성 시점**: 2026-05-01 (Wave 0 진입)
> **갱신 책임**: Wave 0 PR 머지 시 캡처 결과 동기화. Phase 8 close 후 사내 미러 점검 phase에서 §3 갱신.

## 1. 운영 전제 (요약)

- Phase 8 Wave 0~5는 **개방망 표준 npm registry**(`https://registry.npmjs.org/`)로 진행.
- 사내 폐쇄망 검증 환경은 **현재 미확보** → 폐쇄망 빌드는 동일 산출물(`package-lock.json` 고정 + 본 문서 §3 우회 4경로)로 **사후 재현**.
- 진행 중에도 **runtime fetch / CDN URL / telemetry 산출물 zero**, 폰트·아이콘·MSW worker self-host, `package-lock.json` 항상 commit.
- 사내 미러 점검은 Phase 8 종료 후 **별도 phase**에서 수행.

## 2. 환경 캡처 (2026-05-01)

### 2.1 npm 레지스트리

```sh
$ npm config get registry
https://registry.npmjs.org/
```

### 2.2 npm ci dry-run (Wave 0 진입 직전, main 기준)

```sh
$ npm ci --dry-run 2>&1 | tail -5
added 92 packages, and removed 87 packages in 606ms

192 packages are looking for funding
  run `npm fund` for details
```

> Wave 0 진행 중 의존성 추가 시 본 절을 갱신한다 (Wave 0 close 시점 캡처가 정본).

### 2.3 워크스페이스 매니저

- 본 프로젝트는 **npm workspaces** (`package.json` `"workspaces": ["frontend", "backend", "shared"]`).
- `phase-8.md` §2 검증 블록의 `pnpm -w typecheck` 표기는 **계획서 일반 표현**이며, 실제 명령은 `npm run -w <workspace> typecheck` 로 치환한다.

## 3. 폐쇄망 사후 재현 — 우회 4경로 우선순위

> 정본: `phase-8.md` §7.2. 본 절은 **사내 신청 플로우 + 케이스별 절차**를 정리.

### 3.1 우선순위

| 순위 | 경로                                                                    | 적용 케이스                                        | 한계                                                                     |
| ---- | ----------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | **사내 npm 미러** (Verdaccio/Nexus 사내 instance proxying npmjs.org)    | 모든 npm 패키지                                    | 사내 IT/보안 신청·승인 필요. 신규 패키지 첫 요청 시 mirror prefetch 지연 |
| 2    | **오프라인 캐시** (`npm ci --offline` w/ `~/.npm` 또는 `--cache <dir>`) | 동일 lockfile 재빌드, CI 캐시 재현                 | 캐시 무결성 검증 책임 운영자에게. 신규 패키지 추가 불가                  |
| 3    | **Verdaccio 자체 호스팅** (사내망 단독 instance)                        | 미러 미가용 + 패키지 셋 고정                       | 운영 부담 (스토리지·인증·백업). 메이저 업데이트 시 수동 프록시           |
| 4    | **git tarball / `npm pack`** (npm publish되지 않은 raw 소스)            | shadcn/ui 카피본, Pretendard·D2Coding 폰트 release | 자동 업데이트 불가, SHA pin 수동 관리                                    |

### 3.2 사내 신청 플로우 (placeholder — Phase 8 종료 후 별도 phase에서 채움)

> 사내 미러 점검 phase 진입 시 본 절을 채운다. 현재는 placeholder.

- [ ] 신청 채널: TBD (IT 포털 / 보안팀 티켓)
- [ ] 승인 lead time: TBD
- [ ] 등록 가능 패키지 정책: TBD (예: 라이선스 화이트리스트, supply chain 검증)
- [ ] 사내 mirror endpoint: TBD
- [ ] CI 설정 변경 절차: TBD

### 3.3 라이브러리별 raw 도입 (모든 우회 부재 시)

| 대상                           | 절차                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **shadcn/ui 카피본**           | npm 미배포 — `frontend/src/components/ui/` 에 GitHub 소스 카피 + 토큰 매핑 codemod (`scripts/shadcn-token-rewrite.ts`) 적용              |
| **Pretendard / D2Coding 폰트** | Google Fonts CDN **절대 금지**. `pretendard` npm 패키지 또는 GitHub release `.woff2` → `frontend/public/fonts/` self-host + `@font-face` |
| **MSW worker**                 | `mockServiceWorker.js` `frontend/public/` 직접 commit (CDN 금지)                                                                         |
| **Recharts·Tabler icons**      | npm 미러 또는 git tarball (Wave 2~5 진입 시점 결정)                                                                                      |

## 4. Wave 0 강제 규칙 (재확인)

- runtime fetch (`fetch('https://...')`, `<script src="https://cdn...">`) 산출물 **zero**
- CDN URL (Google Fonts, Tailwind play CDN, jsDelivr, unpkg 등) **zero**
- telemetry / analytics 산출물 **zero**
- 폰트·아이콘·MSW worker 모두 **self-host**
- `package-lock.json` **항상 commit** (메이저 lock + lockfileVersion 고정)

검증: Wave 0 PR 검토 시 `git diff` 에 위 4 항목 위반 발견 즉시 reject.

## 6. Dev-only Exemptions

The following tooling packages use Playwright's bundled Chromium and are
**exempt from the phase-8 §7.2 closed-network vendoring discipline** because
they are never deployed to production and only run on developer machines.

| Package                                                            | Location                   | Reason for exemption                                                                                                                                                        |
| ------------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `playwright` (+ Chromium binary via `playwright install chromium`) | `frontend/devDependencies` | Visual-diff harness (`scripts/visual-diff/`) — dev-only tool. Binaries downloaded once per machine via `npx -w frontend playwright install chromium`. Not committed to git. |
| `http-server`                                                      | `frontend/devDependencies` | Serves `prototype/` for the visual-diff harness. Dev-only.                                                                                                                  |

## 5. Changelog

| 일자       | 변경                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-05-02 | §6 추가 — Wave 1.5 Follow-up A Stage 1: `playwright` + `http-server` dev-only exemption 등록                      |
| 2026-05-01 | 초안 — Wave 0 첫 commit 산출물. npm 레지스트리·dry-run 캡처, §3 우회 경로 정리, §3.2 사내 신청 플로우 placeholder |
