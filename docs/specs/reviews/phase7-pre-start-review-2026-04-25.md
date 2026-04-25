# Phase 7 착수 전 종합 리뷰 (2026-04-25)

> **목적**: Phase 7·8 계획 대비 요구사항 문서의 부족함·모순·누락 식별 + prototype 활용 가치 평가  
> **리뷰어**: Claude (사용자 요청)  
> **상태**: 처리 진행 중 — M-2(globaltabs_order 결정) 사용자 판단 대기

---

## 🔴 치명적 모순 (Phase 7 착수 전 반드시 수정)

### M-1: `dashboard.md` 상태 enum 이중 불일치

**문제 1 — "보류" vs "드랍"**

| 파일                      | 사용 값                                          |
| ------------------------- | ------------------------------------------------ |
| `openapi.yaml` L1960      | `['접수', '검토중', '처리중', '완료', '드랍']` ✓ |
| `requirements.md §4`      | `드랍` ✓                                         |
| `feature-voc.md §8.2`     | `드랍` ✓                                         |
| `migrations/003_vocs.sql` | `드랍` ✓                                         |
| **`dashboard.md`**        | **`보류`** 전체 (17곳) ✗                         |

`dashboard.md`는 상태 전환을 "완료/보류", API 파라미터를 `?status=완료,보류`로 기술한다.  
이 문서 기반으로 7-4 대시보드를 구현하면 BE 쿼리가 전부 틀린 enum 값을 사용하게 된다.

**문제 2 — "접수됨" vs "접수"**

`dashboard.md`는 `접수됨`을 일관되게 사용하지만 openapi / migration / feature-voc 전부 `접수`다.  
API 파라미터(`?status=접수됨,검토중...`)가 실 DB enum과 불일치한다.

**수정 방향**: `dashboard.md` 전체 `보류→드랍`, `접수됨→접수` 일괄 치환. prototype 내 동일 값도 함께 확인.

---

### M-2: `dashboard_settings` 스키마 — 세 곳이 불일치

| 컬럼               | `requirements.md §4` | `dashboard.md` SQL | `006_settings.sql` (실 migration) |
| ------------------ | :------------------: | :----------------: | :-------------------------------: |
| `widget_order`     |          ✓           |       ✗ 없음       |                 ✓                 |
| `widget_sizes`     |          ✓           |       ✗ 없음       |                 ✓                 |
| `locked_fields`    |          ✓           |       ✗ 없음       |                 ✓                 |
| `globaltabs_order` |        ✗ 없음        |         ✓          |              ✗ 없음               |

`dashboard.md`는 `globaltabs_order`를 정의하고 GlobalTabs 순서·숨김 기능도 명세하는데, 실제 migration에 없다.  
`requirements.md §4`와 `006_settings.sql`을 기준으로 `dashboard.md` SQL 블록을 업데이트하고,  
`globaltabs_order` 컬럼 추가 여부를 결정해야 한다.

**수정 방향**: `globaltabs_order`를 migration에 추가하거나, `dashboard.md`에서 제거 후 `widget_order`/`widget_sizes`/`locked_fields` 복원.

---

## 🟠 구현 전 처리 권고

### O-1: 세션 스토어 스펙 문구 혼동

`requirements.md §14.1`: "세션 스토어: `connect-pg-simple` 채택... 개발(MemoryStore)과 운영 전환은 `NODE_ENV`로 자동 분기"  
→ 확정된 것처럼 서술되지만 실제 코드는 MemoryStore만 사용 중 (F-4 = Phase 8-1 defer).

**수정 방향**: §14.1에 "**Phase 8-1 구현 예정 — 현재 MemoryStore 사용 중**" 주석 추가.

---

### O-2: `ts-node-dev → tsx` 미교체

Phase 6-4 tech debt: "6-6 이전 또는 6-7에 교체할 것" → 미처리 상태로 Phase 7 진입.  
Node 22에서 불안정한 도구로 Phase 7 전체 BE 라우트를 작성하게 된다.

**수정 방향**: Phase 7 첫 라우트 작성 전 `tsx watch` 교체 (`package.json` `dev` 스크립트 1줄).

---

### O-3: `pino` 로깅 스케줄 역전

Phase 6-4 tech debt 주석: "**BE 라우트 추가 단계(7.x~), 첫 라우트 추가 전에 baseline 잡을 것**"  
→ 현재 Phase 8-4로 배치. Phase 7에서 라우트를 전부 `console.log`로 작성한 뒤 Phase 8에서 일괄 교체하는 구조가 된다.

**수정 방향**: `pino` baseline을 Phase 7 착수 직전으로 앞당김 (`ts-node-dev→tsx` 교체와 묶어서 처리).

---

### O-4: Internal Notes가 Phase 7 태스크 목록에 미명시

`voc_internal_notes`는 별도 테이블·4개 API·특수 권한(User → 404, DOM 비렌더링)·Timeline 통합을 포함한다.  
회귀 테스트 필수 3건이 있는 보안 속성인데, 7-1이나 7-2에 묻혀 누락될 가능성이 있다.

**수정 방향**: Phase 7 태스크 목록에 `7-2a Internal Notes (보안 필수 3건 포함)` 명시.

---

### O-5: 7-11 순서 문제 — 컴포넌트 매핑이 맨 마지막

6-9(Prototype→컴포넌트) 매핑 문서가 없는 상태에서 7-1~7-10을 구현하면 Phase 7 "상시 규칙"  
("스펙과 prototype 불일치 발견 시 질문")을 적용할 기준이 없다.

**수정 방향**:

- `prototype 섹션별 인벤토리 + React 매핑 규칙 문서화` → **7-1 착수 전** 완료
- Storybook 결정·티켓화는 여전히 마지막으로 유지 가능

---

## 🟡 Phase 8 계획 누락

### P-1: Playwright E2E 설정 없음

`requirements.md §13.3` — 핵심 3개 플로우 E2E 테스트 명시.  
Playwright 설치·설정 단계가 Phase 7에도 8에도 없다.

**수정 방향**: Phase 8에 `8-7 Playwright E2E 설정 + 핵심 3플로우 테스트` 추가.

---

### P-2: Jira 마이그레이션 스크립트 없음

`requirements.md §7`: "타이밍: 오픈 전 일괄 이전" → Phase 8-6(배포+smoke test) 전에 실행돼야 한다.  
스크립트 작성이 Phase 8에 포함돼 있지 않다.

**수정 방향**: Phase 8에 `8-8 Jira 마이그레이션 스크립트 작성 + 실행` 추가.

---

## Prototype 활용 가치 평가

| 영역                                                | 가치     | 비고                                      |
| --------------------------------------------------- | -------- | ----------------------------------------- |
| `prototype.html` — 레이아웃·색상 토큰·CSS 클래스    | **높음** | 이미 `design.md §12` 반영, tokens.ts 확정 |
| `prototype/dashboard/dashboard-v3.html` — 위젯 구조 | **높음** | 7-4 구현 시 primary reference             |
| 사이드바 아코디언·드로어·모달 JS 패턴               | **중간** | React 패러다임과 다름, 로직 참조 가능     |
| enum 값("보류"·"접수됨")                            | **위험** | 구버전 값 포함 — 그대로 복사 금지         |

`prototype/dashboard/dashboard-v3.html` 존재 확인. 7-4 착수 전 위젯별 HTML 구조를 React 컴포넌트로 매핑하면 구현 비용을 크게 줄일 수 있다.  
단, prototype 내 enum 값 확인 후 치환 없이 사용 금지.

---

## 권고 처리 순서

| 순위 | 항목                                                                         | 착수 시점            |
| ---- | ---------------------------------------------------------------------------- | -------------------- |
| 1    | `dashboard.md` — `보류→드랍`, `접수됨→접수` 일괄 치환 (M-1)                  | Phase 7 착수 전      |
| 2    | `dashboard_settings` — `globaltabs_order` 추가 여부 결정 + 스키마 정합 (M-2) | Phase 7 착수 전      |
| 3    | `ts-node-dev → tsx` 교체 (O-2)                                               | Phase 7 첫 라우트 전 |
| 4    | `pino` baseline (O-3)                                                        | Phase 7 첫 라우트 전 |
| 5    | prototype 인벤토리·매핑 문서화 — 7-11 앞당기기 (O-5)                         | 7-1 착수 전          |
| 6    | Internal Notes sub-task 명시 (O-4)                                           | 계획 업데이트 시     |
| 7    | `requirements.md §14.1` 세션 스토어 주석 (O-1)                               | 문서 정비 시         |
| 8    | Phase 8에 Playwright + Jira 마이그레이션 추가 (P-1, P-2)                     | Phase 8 계획 시      |
