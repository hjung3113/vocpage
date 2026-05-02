# Wave 1.6 Phase C — Component Rebuild Precedent

> 정본 plan: [`wave-1-6-voc-parity.md`](./wave-1-6-voc-parity.md)
> Phase C-1 (VocStatusBadge, PR #129 merged 2026-05-02) 결과를 룰북으로 고정. 잔여 16개 leaf 컴포넌트 (§5.2 Phase C 진행 순서) 진행 시 본 문서를 단일 출처로 사용한다.

## 1. 목적

Phase C는 컴포넌트당 1 PR로 진행하며 매 PR이 동일한 의사결정과 검증 절차를 따라야 일관된 품질이 유지된다. 본 문서는 PR #129에서 합의된 D1~D4 결정과 per-leaf 체크리스트를 명문화하여 차회 PR이 즉시 같은 트랙을 밟도록 한다.

## 2. C-1 결정 (D1~D4) — 잠금

| ID  | 결정                          | 내용                                                                                                                                                                                |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | CSS 위치                      | 컴포넌트 클래스(`.status-badge`, `.s-{slug}` 등)는 별도 모듈로 분리하지 않고 `frontend/src/styles/index.css`에 추가한다. 토큰과 같은 파일에 모이게 하여 단일 소스를 유지한다.       |
| D2  | 한글 prop value → 영문 슬러그 | 매핑은 **FE-only**. 위치는 `frontend/src/lib/voc-{domain}-slug.ts`. `shared/contracts/**` (BE import 대상)에는 절대 두지 않는다 — 표시 레이어 매핑이 contract에 새는 것을 차단.     |
| D3  | prototype 시각 디테일         | `.status-dot` 처럼 prototype의 시각 요소는 의미가 약해도 그대로 가져온다. 부재 시 prototype 일치도가 깨지기 때문 (사용자 검수 기준).                                                |
| D4  | props API 정책                | 컴포넌트 props는 영문 union 타입을 유지한다. 한글 표시 라벨은 컴포넌트 내부 매핑(`labelMap`)으로만 처리하고 외부에 노출하지 않는다. 호출부는 `<VocXBadge x={voc.x} />` 형태만 사용. |

### 2.1 D2 매핑 컨벤션 (구체)

- 파일명: `frontend/src/lib/voc-{domain}-slug.ts` (예: `voc-status-slug.ts`).
- export: `VOC_{DOMAIN}_SLUG` const map + 타입가드(`isVoc{Domain}Slug`)가 필요하면 같은 파일.
- 사용처: 해당 도메인의 단일 컴포넌트 + 테스트만. 다른 모듈에서 import 하기 시작하면 spread 신호 — 즉시 배럴(`lib/voc-slug.ts`)로 합치는 리팩터 PR을 분리한다.
- 금지: `shared/contracts/**`, `backend/**`, `frontend/src/lib/api/**` 어디에도 두지 않는다.

## 3. per-leaf 체크리스트 (7 항목 — 모두 강제)

각 Phase C leaf PR은 다음 7개 항목을 머지 전에 모두 만족해야 한다. 한 항목이라도 누락되면 PR을 머지하지 않는다.

- [ ] **(1) TDD failing-first** — 컴포넌트 테스트(`__tests__/*.test.tsx`)를 implementation 전에 작성하고 처음에는 RED여야 한다. 커밋 히스토리에 RED → GREEN 흐름이 보이지 않으면 reject.
- [ ] **(2) §7.3 lint scoped** — 변경 파일만 대상으로 `lint:tokens` 규칙(raw hex/OKLCH/inline color style) 0 hits. 전체 리포지토리 lint 노이즈에 묻히지 않도록 변경 diff 한정 grep 결과를 PR 설명에 포함.
- [ ] **(3) 4 reviewer + codex** — `architect` / `code-reviewer` / `critic` / `designer` 4명 + `codex:adversarial-review` 1회 모두 거친다. self-review 금지. blocker는 머지 전 해소.
- [ ] **(4) visual-diff data-pcomp 자손 SKIP 0** — visual-diff harness 결과에서 본 컴포넌트의 data-pcomp 자손 노드 SKIP 0. 신규 SKIP 발생 시 prototype 기준으로 컴포넌트 수정.
- [ ] **(5) 사용자 시각 검수** — dev server (`npm run dev`)에서 사용자가 직접 컴포넌트를 확인하고 OK 응답 후에만 머지. 색·간격·hover 상태가 prototype과 시각적으로 동등해야 한다.
- [ ] **(6) 구버전 동시 삭제** — 신규 컴포넌트와 호출부 교체, 구버전 코드 삭제를 같은 PR에 묶는다 (D8). 별도 cleanup PR 금지.
- [ ] **(7) FE-only slug 격리** — 한글 ↔ 영문 슬러그 매핑이 필요하면 §2.1 컨벤션을 따른다. shared/contracts 진입 PR은 거부.

## 4. PR 작성 양식

PR 설명에 다음 섹션을 명시한다.

```
## Wave 1.6 Phase C — <Component> rebuild

### 결정 적용 (D1-D4)
- D1: CSS 위치 = index.css ✅
- D2: 슬러그 매핑 위치 = (FE-only path or N/A) ✅
- D3: prototype 시각 요소 보존 = (.list of preserved details) ✅
- D4: props = (영문 union signature) ✅

### per-leaf 체크리스트 (7)
- [x] (1) TDD failing-first — commit `<sha>` RED, `<sha>` GREEN
- [x] (2) §7.3 lint scoped — `<grep command output: 0 hits>`
- [x] (3) 4 reviewer + codex — links to review comments
- [x] (4) visual-diff data-pcomp SKIP 0 — `<harness output snippet>`
- [x] (5) 사용자 시각 검수 — confirmed in conversation `<date>`
- [x] (6) 구버전 동시 삭제 — file `<path>` removed in same PR
- [x] (7) FE-only slug 격리 — `<path>` (or N/A)

### 변경 요약
- (브리프 description)
```

## 5. C-2 (VocPriorityBadge) 적용 메모

VocPriorityBadge는 prototype·BE 모두 영문 union(`urgent | high | medium | low`)이므로 한글 슬러그 매핑이 **불필요** — §3 (7) 항목은 N/A 처리. 그 외 (1)~(6)은 모두 그대로 강제.

## 6. 변경 이력

- 2026-05-02 — 초안 작성 (Wave 1.6 Phase C-1 PR #129 merge 직후, critic Q3 follow-up)
