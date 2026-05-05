# FSD Migration — Frontend Convention Alignment

> **정본 계획**: `.omc/plans/fsd-migration-plan.md` (파일 맵 + ADR 상세)  
> **최종 업데이트**: 2026-05-05  
> **선행 조건**: Wave 1.6 ζ 진입 전 완료 권장

---

## 사전 작업 완료 (2026-05-05)

Convention 문서 전체 작성 완료. 이후 Step 1부터 문서 기준으로 구현.

| 문서              | 위치                                                  |
| ----------------- | ----------------------------------------------------- |
| 네이밍 규칙       | `docs/specs/requires/naming-conventions.md`           |
| 상태 관리         | `docs/specs/requires/state-management-conventions.md` |
| API               | `docs/specs/requires/api-conventions.md`              |
| 라우팅            | `docs/specs/requires/routing-conventions.md`          |
| 에러/로딩/빈 상태 | `docs/specs/requires/error-loading-conventions.md`    |
| 폼/Validation     | `docs/specs/requires/form-conventions.md`             |
| 테이블/필터       | `docs/specs/requires/table-filter-conventions.md`     |
| 날짜/시간         | `docs/specs/requires/datetime-conventions.md`         |
| 테스트/Mock       | `docs/specs/requires/test-conventions.md`             |
| 환경변수          | `docs/specs/requires/env-conventions.md`              |

작업 유형별 라우팅: `docs/specs/README.md §0.2`

---

## 목표

현재 hybrid 구조(`api/`, `components/`, `contexts/`, `hooks/`, `lib/`)를  
FSD 6-레이어 구조로 전환한다.

```
app → pages → widgets → features → entities → shared
```

추가:

- tsconfig + vite path alias (`@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`, `@contracts/*`)
- 레이어 간 단방향 의존성 강제

---

## 전략

| 항목    | 결정                                                           |
| ------- | -------------------------------------------------------------- |
| 방식    | 전면 재구성 (전체 동시 이동)                                   |
| 순서    | Bottom-up — shared → entities → features → widgets → app/pages |
| 범위    | 리팩토링 전용 (새 기능 없음)                                   |
| PR 단위 | 레이어 1개 = PR 1개 (7 PR)                                     |

---

## Step 진행 현황

| Step | Branch                         | 내용                                          | 상태                           |
| ---- | ------------------------------ | --------------------------------------------- | ------------------------------ |
| 0    | —                              | Convention 문서 작성 (사전 작업)              | ✅ 2026-05-05                  |
| 1    | `refactor/fsd-path-alias`      | tsconfig + vite alias 설정                    | ✅ 2026-05-05                  |
| 2    | `refactor/fsd-shared-layer`    | shared/ui, api, lib, hooks, styles, config    | ✅ 2026-05-05 (PR #208)        |
| 3    | `refactor/fsd-entities-layer`  | entities/voc, user, notification, master      | ✅ 2026-05-05 (PR #211)        |
| 4    | `refactor/fsd-features-layer`  | features/auth, voc-list-filter, voc-create 등 | ✅ 2026-05-05 (PR #213 + #215) |
| 5    | `refactor/fsd-widgets-layer`   | widgets/app-shell, voc-workspace              | 🟡 진행 중                     |
| 6    | `refactor/fsd-app-pages-layer` | app/providers, pages 정리                     | ⬜ 미착수                      |
| 7    | `refactor/fsd-cleanup`         | 구 디렉토리 삭제 + 검증                       | ⬜ 미착수                      |

범례: ✅ 완료 / 🟡 진행 중 / ⬜ 미착수

---

## 완료 기준

- [ ] `frontend/src/` 최상위 7개 레이어만 존재
- [ ] `components/`, `contexts/`, `hooks/`, `lib/`, `api/`, `styles/` 삭제
- [ ] 모든 레이어 간 import → alias 사용 (상대경로 없음)
- [ ] `entities` → `features` 역방향 import 0건
- [ ] `npm run typecheck -w frontend` passes
- [ ] `npm run test -w frontend -- --run` passes
- [ ] 브라우저 VOC 목록/필터/Drawer 정상 동작

---

## 업데이트 규칙

PR 머지 시: 상태 ⬜ → ✅, 날짜 기록  
작업 중: 상태 ⬜ → 🟡
