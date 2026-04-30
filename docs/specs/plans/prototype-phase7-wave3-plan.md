# Prototype Phase 7 — Wave 3 Plan

> 작성일: 2026-05-01
> 목적: Wave 2 종료 후 잔여 9건 갭을 닫고 prototype을 "Phase 8 구현 정답집" 수준으로 마감
> 브랜치: `docs/prototype-phase7-wave3-plan` (본 문서) → 이후 sub-wave별 feature 브랜치
> 선행: Wave 2 모든 PR 머지 완료 (2026-05-01) · B-9 통합 검증 PASS

---

## 1. 목표 — "B-" 기준

Phase 8 구현자가 prototype.html + spec만 보고 React로 옮길 때 **재해석/재결정 없이** 작업 가능한 수준.

**포함**:

- Critical 4건 + Major 1건 — 100% 시연
- Minor 중 FE mock 가능 항목 4건 — 시연 (charcount/highlight/자동 태그/가로 스크롤)
- 페이지별 비데이터 상태 + drawer 권한 차단 행동 — 시연

**제외 (의도적)**:

- N-03 알림 폴링 — BE/timer 의존, mock 가치 낮음. spec 한 줄로 충분
- 4역할 × 모든 상태 풀 매트릭스 — B-5 + B-9 통합 검증으로 충분, 조합 폭발 회피
- §13 외 신규 토큰 — 기존 토큰만 사용

---

## 2. 잔여 갭 매핑 (Wave 2 후 기준)

| ID   | 분류     | 영역                      | spec                  | sub-wave |
| ---- | -------- | ------------------------- | --------------------- | -------- |
| C-02 | Critical | Due Date 자동 설정 + 필드 | feature-voc §8.4.1/2  | W3-A     |
| N-01 | Minor    | 자동 태그 추천            | feature-voc §8.8.2    | W3-A     |
| N-02 | Minor    | 입력 한도 charcount       | feature-voc §8.10     | W3-A     |
| N-04 | Minor    | 검색 결과 highlight       | feature-voc §9.6      | W3-A     |
| C-10 | Critical | Type Badge                | uidesign §13.4        | W3-B     |
| C-11 | Critical | Status Dot                | uidesign §13.5        | W3-B     |
| C-14 | Critical | Admin 비데이터 상태       | uidesign §13.11       | W3-B/C   |
| M-05 | Major    | 외부마스터 필드-매핑      | external-masters §2   | W3-B     |
| N-05 | Minor    | W7 가로 스크롤            | dashboard W7          | W3-C     |
| —    | 보강     | Dashboard 위젯 빈 상태    | dashboard W2~W11      | W3-C     |
| —    | 보강     | Drawer 권한 차단 행동     | feature-voc §8.3·§8.4 | W3-C     |

---

## 3. Sub-Wave 구성

### W3-A. VOC 본체 (drawer + modal + voc-list)

**브랜치**: `feat/prototype-w3a-voc-core`

| 항목                | 작업                                                                                                                                              | 파일                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| C-02 Due Date       | Priority 4종 → 자동 due_date 계산 (P0=1d, P1=3d, P2=7d, P3=30d). 필드 UI: drawer + 등록 modal에 datepicker. manager+ override 가능, user readonly | `js/drawer.js`, `js/modal.js`, `prototype.html` (datepicker markup), `css/drawer.css` |
| N-01 자동 태그 추천 | 등록 modal에서 제목/본문 키워드 → 태그 칩 추천 영역 (mock dictionary). "추가" 클릭 시 선택 태그에 합류                                            | `js/modal.js`                                                                         |
| N-02 charcount      | 제목 (max 100) / 본문 (max 5000) / 댓글 (max 1000) — input 옆 `123/100` 표시, 90% 도달 시 amber, 초과 red+disabled                                | `js/modal.js`, `js/drawer-core.js`, `css/modal.css`                                   |
| N-04 검색 highlight | `voc-list.js` 검색어 매칭 → `<mark>` 래핑, `.search-highlight` 토큰 (background var(--brand-soft))                                                | `js/voc-list.js`, `css/list.css`                                                      |

**수용 기준**:

- Priority 변경 → due_date 자동 갱신 시연 (manager 역할)
- 등록 modal에 "키보드" 입력 → "Hardware" 태그 추천 칩 표시
- 본문 4501자 입력 시 amber → 5001자 시도 시 red + 저장 disabled
- 검색 "VOC" → 목록 row의 일치 부분 마크 강조

---

### W3-B. Admin 공통 컴포넌트

**브랜치**: `feat/prototype-w3b-admin-components`

| 항목                       | 작업                                                                                                                                                                | 파일                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| C-10 Type Badge            | `.type-badge-admin` — voc-type 페이지 type 셀에 색상 도트+라벨. 4 variant (system/menu/issue-kind/external)                                                         | `css/components/badges.css`, `js/admin-master.js`                 |
| C-11 Status Dot            | `.status-dot` — admin-table is_active/is_archived 컬럼에 8px 도트 (green/gray/red). users·tag-master·voc-type·trash 페이지 적용                                     | `css/components/badges.css`, 다수 admin-\*.js                     |
| C-14 Admin Non-data States | empty/loading/error 3 variant. `.admin-empty` (아이콘+CTA), `.admin-loading` (스켈레톤 row 5), `.admin-error` (재시도 버튼). admin 8 페이지에 토글 가능한 데모 버튼 | `css/components/admin-states.css`, 신규 `js/admin-states-demo.js` |
| M-05 외부마스터 필드-매핑  | external-masters 페이지 상단에 "필드 매핑" 섹션 추가 — VOC 어떤 필드가 어느 마스터를 사용하는지 표 (예: equipment_id → 설비 마스터). 읽기 전용                      | `js/admin-external-masters.js`, `prototype.html`                  |

**수용 기준**:

- voc-type 페이지에 4종 type-badge 표시
- users 페이지 비활성 사용자 행에 회색 status-dot
- admin 페이지마다 "비어있음/로딩/오류" 데모 토글 동작
- external-masters 상단에 필드 매핑 표 노출

---

### W3-C. Dashboard 잔여 + 갭 재스캔

**브랜치**: `feat/prototype-w3c-dashboard-and-rescan`

| 항목                  | 작업                                                                                                                       | 파일                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| N-05 W7 가로 스크롤   | 현황 카드 컨테이너 `overflow-x: auto` + 스크롤 인디케이터. 5+ 시스템 시 시연                                               | `js/dashboard-render.js`, `css/dashboard.css`              |
| W2~W11 빈 상태        | 각 widget에 데모 토글 (정상/빈/오류). 빈 상태는 `.widget-empty` 공통 컴포넌트, dashboard 카드 톤 유지                      | `js/dashboard-render.js`, `css/dashboard.css`              |
| Drawer 권한 차단      | User 역할일 때 drawer 댓글 input/첨부 버튼 fail-closed + "권한이 없습니다" 인라인 안내 (토스트 아님). admin/manager는 정상 | `js/drawer-core.js`, `css/drawer.css`                      |
| Wave 3 종료 갭 재스캔 | grep 기반 spec 섹션 ↔ prototype 매핑 재실행. 결과 0 잔여 확인                                                              | 신규 `docs/specs/reviews/prototype-phase7-wave3-rescan.md` |

**수용 기준**:

- W7 카드 컨테이너 좌우 스크롤 동작
- 11개 widget마다 "빈 상태" 토글 시연
- User로 전환 → drawer 댓글창 disabled + 안내 텍스트
- 재스캔 문서에 "Critical 0 / Major 0 / Minor 0 (N-03 OOS 명시)" 결론

---

## 4. R-4 — Phase 8 진입 게이트 (Wave 3 종료 후 단독)

**브랜치**: `chore/r-4-tsx-watch`

- `backend/package.json` `dev` 스크립트: `ts-node-dev` → `tsx watch`
- 의존성: `ts-node-dev` 제거, `tsx` 추가
- 검증: `npm install` → `npm run dev` smoke (Express 부팅 + watch 동작 확인)
- PR 별도 — prototype 작업과 컨텍스트 분리

---

## 5. 리뷰 프로토콜

각 sub-wave PR마다:

1. **R1 commit** — 작업 완료
2. **5인 자가-금지 리뷰** (architect / code / security / verifier / critic) × 3관점 (spec 정합 / 구현 품질 / 회귀)
3. **R2 fix commit** — P0 일괄 fix
4. **R2 verifier APPROVE** 후 PR open

**합격선**: R2 평균 ≥85, P0 0건, hex/oklch literal 0건, 기존 토큰 외 신규 토큰 추가 0건.

---

## 6. 일정 (목표)

| 단계     | 예상 회차            |
| -------- | -------------------- |
| W3-A     | 1 회차               |
| W3-B     | 1 회차               |
| W3-C     | 1 회차 (재스캔 포함) |
| R-4      | 0.5 회차             |
| **합계** | **3.5 회차**         |

---

## 7. 종료 조건 (Phase 7 close)

- [ ] W3-A/B/C 모두 R2 PASS + PR 머지
- [ ] `prototype-phase7-wave3-rescan.md` 갭 0 잔여 확인 (N-03 OOS 명시)
- [ ] R-4 머지
- [ ] `claude-progress.txt` Phase 7 종료 + Phase 8 진입점 갱신
- [ ] `next-session-tasks.md` Phase 7 표 모든 항목 ✅, Phase 8 8-1 시작점 명시

이 7개 조건 충족 시 **Phase 7 close, Phase 8 8-1 (VOC 핵심 플로우 CRUD) 진입**.
