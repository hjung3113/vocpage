# Wave 5 — 인앱 알림 + Sidebar nav count badge 정착

> 목적: spec §8.6 / §8.14 의 인앱 알림 (벨 / 미읽음 배지 / Urgent 🔴! / 30초 폴링 / ETag 304 / 5분 디바운스 / 50건·30일 cap) 을 구현하고, Sidebar nav-item count badge (FU-008) 를 같은 추상으로 정착시킨다.
> Follow-up bucket: `followup-bucket.md`. ID 규칙은 root `CLAUDE.md`.
> 정본 product spec: `requires/feature-voc.md §8.6 / §8.14` + `requires/requirements.md §4 (notifications) / §66 (react-query staleTime) / D2 / D8` + `requires/uidesign.md §14.10 (Sidebar Count Badge)`.

## 0. 진입 게이트

- **Hard-block**: Wave 3 머지 완료 — ✅ (PR #271, 2026-05-09).
- **사용자 승인**: 본 plan §3 결정·§5 Phase 게이트 승인 후 Phase A 진입.
- **ADR 의존**: 없음. 본 Wave 의 결정은 모두 spec 모호점 해소 수준 (Phase B 에서 `feature-voc.md §8.6` 두 줄 추가로 갈음).

## 1. 배경

- `notifications` 테이블 + 인덱스는 `migrations/011` 로 이미 정착. 본 Wave 는 신규 마이그 없음.
- `Sidebar.tsx` 에 `/notifications` nav item + Bell 아이콘 + Wave 4 의 `/notice` urgent 배지 (level=urgent 공지 popup) 가 이미 존재. 본 Wave 의 🔴! 는 **알림 발 Urgent VOC** 전용 (서로 다른 도메인, 같은 시각 패턴).
- AppShell 은 글로벌 top bar 가 없고 헤더는 페이지별 `<PageHeader>` (FU-017 PR #265) — 알림 벨은 **Sidebar `/notifications` nav item 옆 count badge + Urgent 배지** 로 끼운다 (uidesign.md §14.10 패턴 + Wave 4 urgent 배지 패턴 재사용).
- FU-008 (Notice/FAQ unread count 실연동) 은 같은 컴포넌트 추상 (`<NavItemCountBadge>`) 으로 흡수해 패턴을 통일한다.

## 2. 범위

### 2.1 In-scope

| 영역      | 산출물                                                                                                                                                                                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **BE**    | `services/notifications.ts` (`notifyOnComment / notifyOnStatusChange / notifyOnAssign` + 5분 디바운스 + lazy trim 50건·30일) · `GET /api/notifications` 목록 + 일괄 read · `GET /api/notifications/unread-count` ETag/304 · 응답 DTO 에 `voc.priority` join → `isUrgent` 계산 · 트리거 wiring (vocs / comments 라우트 응답 직전) · `shared/openapi.yaml` 갱신 |
| **FE**    | `<NavItemCountBadge>` 추상 (Sidebar nav-item 우측 슬롯) · Sidebar `/notifications` count + 🔴! Urgent 배지 · Sidebar `/notice` `/faq` unread count 실연동 (FU-008 흡수) · 두 쿼리 키 (`['notifications','unread-count']` 30초 폴링 + ETag 304, `['notifications','list']` 패널 열림 시) · 알림 패널 UI (최근 50건, 클릭 시 일괄 read) · 빈/에러/로딩 상태 |
| **Spec**  | `feature-voc.md §8.6` 두 줄 추가: ① **lazy trim** (cap 50 + 30일 자동 삭제, read 시점 정리, cron 회피) ② **Urgent 배지 = 표시 시점 priority 기준** (Urgent 해제 시 자동 해제)                                                                                                                                                                                |

### 2.2 Out-of-scope

- 시각 회귀 12 화면 — 사용자 ad-hoc 진행 (Wave 미편성).
- AppShell 글로벌 top bar 신설 — 본 Wave 에서 부정. Sidebar nav-item 옆 배치로 갈음.
- Multi-instance advisory lock — FU-020 이연 (단일 인스턴스 전제).
- Playwright 알림 e2e — P-NG 이연.
- 이메일 알림 — NextGen 1순위 (`requirements.md §275`).
- 신규 마이그 — 본 Wave 진입 시점 다음 마이그 번호 = 021 (변동 없음).

### 2.3 Touch budget

- **변경**: `backend/src/services/notifications.ts` (신규/확장) · `backend/src/routes/notifications.ts` (신규) · `backend/src/routes/vocs.ts` (트리거 호출 추가) · `backend/src/routes/comments.ts` (트리거 호출 추가) · `shared/contracts/notifications/**` · `shared/openapi.yaml` · `frontend/src/widgets/app-shell/Sidebar.tsx` · `frontend/src/widgets/app-shell/NavItemCountBadge.tsx` (신규) · `frontend/src/features/notifications/**` (신규 — 패널 UI / 쿼리 훅) · `frontend/src/api/notifications.ts` (신규) · `docs/specs/requires/feature-voc.md §8.6` (두 줄).
- **비변경**: AppShell.tsx 본체 · `<PageHeader>` · 토큰 정의부 (`tokens.ts`) · 마이그 / 스키마 · 권한 매트릭스 · VOC 도메인 라우트 본문 (트리거 호출 한 줄 추가만).

## 3. 결정 (잠금 — 사용자 승인 시점에 잠긴다)

| ID     | 항목                  | 결정                                                                                                                                                                              | 근거                                                  |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| W5-D1  | 알림 벨 placement     | **Sidebar `/notifications` nav item 옆 count badge + 🔴! Urgent 배지**. AppShell 미변경. (uidesign §14.10 + Wave 4 urgent 배지 패턴 재사용)                                       | grilling Q11 (a)                                      |
| W5-D2  | Urgent 배지 기준      | **표시 시점 VOC priority** — Urgent 해제 시 🔴! 자동 해제. 알림 row 에 박지 않고 응답 DTO 에서 `voc.priority` join 으로 계산                                                       | grilling Q7 (c) + Q7-1                                |
| W5-D3  | 디바운스 구현         | **앱 레이어 + DB 조회 기반** (5분 dedup, INSERT 직전 `(user_id, type, voc_id, created_at)` 인덱스 SELECT). 재시작 / 멀티 인스턴스 안전성은 단일 인스턴스 전제.                     | `requirements.md` D8 (확정)                           |
| W5-D4  | cap / 자동 삭제       | **lazy trim** — read 시점 (목록 조회 시) 30일 초과 row 삭제 + 사용자별 50번째 이후 trim. cron / 마이그 신설 회피                                                                  | grilling Q4 (b) (cap+lazy trim 채택)                  |
| W5-D5  | 트리거 코드 위치      | **`services/notifications.ts` 단일 모듈** — `notifyOnComment / notifyOnStatusChange / notifyOnAssign`. 디바운스 / lazy trim 동거                                                  | grilling Q6 (b)                                       |
| W5-D6  | TDD 의무 surface      | **BE 항목 1~4** (list / unread-count + ETag / 디바운스 / cap+lazy trim). 트리거 5번은 vocs/comments 라우트 통합 테스트로 흡수 (Wave 3 권한 매트릭스 분산 커버 패턴)                | `CLAUDE.md §Engineering rules` "TDD for irreversible" |
| W5-D7  | FE 쿼리 분리          | **두 쿼리 키**: `['notifications','unread-count']` (30초 폴링 + ETag 304, fetch wrapper 가 `If-None-Match` 자동 부착, 304 시 캐시 반환) · `['notifications','list']` (패널 열림 시) | grilling Q5 (a) + `requirements.md §66`               |
| W5-D8  | nav badge 추상화      | `<NavItemCountBadge>` 단일 컴포넌트 — 알림 unread / Notice unread / FAQ unread 세 곳에서 동일 패턴 사용. **FU-008 흡수**.                                                          | grilling Q12 (a) + uidesign §14.10                    |
| W5-D9  | PR 분할               | **2 PR 직렬**: PR-1 = Phase A (BE 단독, contract irreversible) → PR-2 = Phase B (FE + spec 두 줄)                                                                                 | grilling Q8 (b)                                       |
| W5-D10 | ADR                   | **신설 없음** — `feature-voc.md §8.6` 두 줄 추가 (W5-D2 / W5-D4) 로 갈음                                                                                                          | grilling Q9 (b)                                       |

## 4. 원칙

1. **Spec 정본 우선** — `feature-voc.md §8.6 / §8.14` + `requirements.md §4 / §66 / D2 / D8` 충돌 시 사용자 보고. 임의 동기화 금지.
2. **마이그 신설 금지** — `migrations/011` 의 컬럼 / 인덱스로 충분. 멀티 인스턴스 advisory lock 은 FU-020 이연.
3. **계약은 Phase A 에서 잠금** — `shared/openapi.yaml` + `shared/contracts/notifications/**` 갱신은 PR-1 안에서 종결. Phase B 의 FE 변경은 contract 소비만.
4. **Sidebar 직접 수정** — AppShell 슬롯 prop 신설 부정 (W5-D1). Sidebar 가 알림 쿼리 직접 구독.
5. **Urgent 도메인 분리** — `/notice` 의 urgent 배지 (Wave 4, 공지 popup level=urgent) 와 `/notifications` 의 🔴! Urgent 배지 (본 Wave, VOC priority=urgent) 는 다른 도메인. 컴포넌트는 같은 시각 패턴 재사용 가능하나 데이터 소스 분리.

## 5. Phase

| Phase     | 산출물 / 변경                                                                                                                                                                                                                                                                                                | TDD                                                                                       | PR    | 게이트                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| **A. BE** | `services/notifications.ts` (W5-D5) + `routes/notifications.ts` (`GET list` + `GET unread-count` ETag/304) + DTO `isUrgent` join (W5-D2) + lazy trim (W5-D4) + 디바운스 (W5-D3) + vocs/comments 라우트 트리거 wiring + `shared/openapi.yaml` + `shared/contracts/notifications/**`                          | 항목 1~4 단위 + 트리거 wiring 의 vocs/comments 라우트 통합 테스트                          | PR-1  | BE Jest+Supertest 그린 · `npm run typecheck -w backend` 0 · 트리거 통합 테스트 그린 · contract diff 사용자 검수 |
| **B. FE** | `<NavItemCountBadge>` (W5-D8) + Sidebar `/notifications` count + 🔴! 배지 + `/notice` `/faq` unread 실연동 (FU-008 close) + `useUnreadCount` (`['notifications','unread-count']` 30초 + ETag) + `useNotificationsList` (패널) + 알림 패널 UI (최근 50건 / 일괄 read) + `feature-voc.md §8.6` 두 줄 추가 | Vitest: `<NavItemCountBadge>` · Sidebar 통합 (count / 🔴!) · 패널 (open / read / 빈/에러) · ETag 304 mock | PR-2  | FE Vitest 그린 · `npm run typecheck -w frontend` 0 · `lint` 0 · `lint:tokens` 0 · spec 두 줄 반영               |

## 6. Close 게이트

- BE Jest+Supertest 그린.
- FE Vitest 그린 (Sidebar `/notifications` count + 🔴! 배지 + Notice/FAQ count 실연동 + 패널 + ETag 304 회귀 포함).
- `npm run lint -w frontend` 0 error · `lint:tokens` (raw hex / OKLCH) 0 hits.
- vocs / comments 라우트 트리거 통합 테스트 그린 (W5-D6).
- **FU-008 close** — followup-bucket row Resolution 갱신.
- `feature-voc.md §8.6` 두 줄 반영 (W5-D2 / W5-D4).

## 7. Open Questions

없음. 본 plan 작성 시점 (2026-05-09) 모든 분기는 §3 결정에 잠금. 진행 중 신설 OQ 발생 시 본 §7 추가 후 사용자 승인 게이트.

## 8. 이연

| 항목                                       | 사유                                              | 진입 조건                              |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| 시각 회귀 12 화면 baseline                 | 사용자 ad-hoc (Wave 미편성)                       | 사용자 임의 시점                       |
| Multi-instance advisory lock (FU-020)      | 단일 인스턴스 전제                                | 다중 인스턴스 운영 진입 시             |
| Playwright 알림 e2e (P-NG)                 | NextGen flow                                      | NextGen Wave 진입 시                   |
| 이메일 알림                                | NextGen 1순위 (`requirements.md §275`)            | 사내 이메일 시스템 접근 후             |
| AppShell 글로벌 top bar                    | 본 Wave 에서 부정 (W5-D1). Sidebar 배치로 갈음    | spec 변경 발의 시 별 Wave              |
