# Wave 1.6 Phase C — Component Rebuild Precedent

> 정본 plan: [`wave-1-6-voc-parity.md`](./wave-1-6-voc-parity.md)
> Phase C-1 (VocStatusBadge, [PR #129](https://github.com/hjung3113/vocpage/pull/129) merged 2026-05-02) 결과를 룰북으로 고정. 잔여 16개 leaf 컴포넌트 (정본 plan §5.2 Phase C 진행 순서) 진행 시 본 문서를 단일 출처로 사용한다.

## 1. 목적

Phase C는 컴포넌트당 1 PR로 진행하며 매 PR이 동일한 의사결정과 검증 절차를 따라야 일관된 품질이 유지된다. 본 문서는 [PR #129](https://github.com/hjung3113/vocpage/pull/129)에서 합의된 C1.D1~C1.D6 결정과 per-leaf 체크리스트를 명문화하여 차회 PR이 즉시 같은 트랙을 밟도록 한다.

> **ID 네임스페이스 주의**: 본 문서의 `C1.Dn`은 PR-#129(C-1) 구현 단계에서 도출된 결정이며, 정본 plan의 `D1~D10`(plan-level decisions)과는 별도 네임스페이스다.

## 2. C-1 결정 (C1.D1~C1.D6) — 잠금

| ID    | 결정                          | 내용                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1.D1 | CSS 위치                      | 컴포넌트 클래스(`.status-badge`, `.s-{slug}` 등)는 별도 모듈로 분리하지 않고 `frontend/src/styles/index.css`에 추가한다. 토큰과 같은 파일에 모이게 하여 단일 소스를 유지한다.                                                                                                                                                                                                                                |
| C1.D2 | 한글 prop value → 영문 슬러그 | 매핑은 **FE-only**. 위치는 `frontend/src/lib/voc-{domain}-slug.ts`. `shared/contracts/**`(BE import 대상), `backend/**`, `frontend/src/lib/api/**` 어디에도 두지 않는다 — 표시 레이어 매핑이 contract에 새는 것을 차단. **enforcement는 현재 수동 코드리뷰** (lint 미구비, 향후 grep-based CI 검사 follow-up).                                                                                               |
| C1.D3 | prototype 시각 디테일         | `.status-dot` 처럼 prototype의 시각 요소는 의미가 약해도 그대로 가져온다. 부재 시 prototype 일치도가 깨지기 때문 (사용자 검수 기준).                                                                                                                                                                                                                                                                         |
| C1.D4 | props API 정책                | 컴포넌트 props는 영문 union 타입을 유지한다. 한글 표시 라벨은 컴포넌트 내부 매핑(`labelMap`)으로만 처리하고 외부에 노출하지 않는다. 호출부는 `<VocXBadge x={voc.x} />` 형태만 사용.                                                                                                                                                                                                                          |
| C1.D5 | a11y 일관성 (Q2)              | 컴포넌트 outer 노드에 `aria-label`(예: `상태 ${value}`) 부여. 시각 디테일 자손 노드(`.status-dot` 등)는 `aria-hidden`. 차후 sibling badge(VocPriorityBadge·VocAssignee 등) 모두 동일 패턴.                                                                                                                                                                                                                   |
| C1.D6 | shared barrel 임포트 (Q4)     | `shared/contracts/voc` 같은 배럴 경로만 import. `shared/contracts/voc/entity` 같은 deep path import 금지 — 배럴이 끊기면 contract 모듈 분해의 영향이 FE 광범위 surface로 새기 때문. **enforcement는 현재 수동 코드리뷰** (C1.D2와 동일; eslint `no-restricted-imports`로 `shared/contracts/voc/*` 차단 follow-up). 배럴 자체(`shared/contracts/voc/index.ts`)의 re-export 안정성 보장은 별도 follow-up 과제. |

### 2.1 C1.D2 매핑 컨벤션 (구체)

- 파일명: `frontend/src/lib/voc-{domain}-slug.ts` (예: `voc-status-slug.ts`).
- export: `VOC_{DOMAIN}_SLUG` const map + 타입가드(`isVoc{Domain}Slug`)가 필요하면 같은 파일.
- 사용처: 해당 도메인의 단일 컴포넌트 + 테스트만. 다른 모듈에서 import 하기 시작하면 spread 신호 — 즉시 배럴(`lib/voc-slug.ts`)로 합치는 리팩터 PR을 분리한다.
- 금지 디렉터리: `shared/contracts/**`, `backend/**`, `frontend/src/lib/api/**`.

## 3. per-leaf 체크리스트 (7 항목)

각 Phase C leaf PR은 다음 7개 항목을 머지 전에 모두 만족해야 한다. 일부 항목이 컴포넌트 특성상 적용 불가하면 **PR 설명에 `N/A — <사유 1줄>` 명시 후 통과**(예: 영문 union만 쓰는 컴포넌트는 (7) FE-only slug 격리가 N/A). N/A 항목이 PR당 ≥3개면 본 룰북 재검토 — **재검토 트리거는 사용자 + 해당 PR 작성자**, 룰북 갱신 PR을 별도로 신설 후 다음 leaf PR 시작.

- [ ] **(1) TDD failing-first** — 컴포넌트 테스트(`__tests__/*.test.tsx`)를 implementation 전에 작성하고 처음에는 RED여야 한다. 커밋 히스토리에 RED → GREEN 흐름이 보이지 않으면 reject.
- [ ] **(2) §7.3 lint scoped** — 변경 파일만 대상으로 `lint:tokens` 규칙(raw hex/OKLCH/inline color style) 0 hits. 전체 리포지토리 lint 노이즈에 묻히지 않도록 변경 diff 한정 grep 결과를 PR 설명에 포함.
- [ ] **(3) 4 reviewer + codex** — `architect` / `code-reviewer` / `critic` / `designer` 4명 + `codex:adversarial-review` 1회 모두 거친다. self-review 금지. blocker는 머지 전 해소.
- [ ] **(4) visual-diff data-pcomp 자손 SKIP 0** — visual-diff harness 결과에서 본 컴포넌트의 data-pcomp 자손 노드 SKIP 0. 신규 SKIP 발생 시 prototype 기준으로 컴포넌트 수정.
- [ ] **(5) 사용자 시각 검수** — dev server (`npm run dev`)에서 사용자가 직접 컴포넌트를 확인하고 OK 응답 후에만 머지. 색·간격·hover 상태가 prototype과 시각적으로 동등해야 한다.
- [ ] **(6) 구버전 동시 삭제** — 신규 컴포넌트와 호출부 교체, 구버전 코드 삭제를 같은 PR에 묶는다 (정본 plan §3 D8). 별도 cleanup PR 금지.
- [ ] **(7) FE-only slug 격리** — 한글 ↔ 영문 슬러그 매핑이 필요하면 §2.1 컨벤션을 따른다. shared/contracts 진입 PR은 거부. (영문 union 컴포넌트는 N/A.)

## 4. PR 작성 양식

PR 설명에 다음 섹션을 명시한다.

```
## Wave 1.6 Phase C — <Component> rebuild

### 결정 적용 (C1.D1–C1.D6)
- C1.D1 CSS 위치 = index.css ✅
- C1.D2 슬러그 매핑 위치 = (FE-only path or N/A — 사유) ✅
- C1.D3 prototype 시각 요소 보존 = (preserved details list) ✅
- C1.D4 props = (영문 union signature) ✅
- C1.D5 a11y = aria-label "<예시>" / 자손 aria-hidden ✅
- C1.D6 shared import = barrel path only (e.g. `shared/contracts/voc`) ✅

### per-leaf 체크리스트 (7)
- [x] (1) TDD failing-first — RED <short-sha>, GREEN <short-sha>
- [x] (2) §7.3 lint scoped — `<grep cmd>` → 0 hits
- [x] (3) 4 reviewer + codex — review comment links
- [x] (4) visual-diff data-pcomp SKIP 0 — `<harness PASS line>`
- [x] (5) 사용자 시각 검수 — confirmed YYYY-MM-DD
- [x] (6) 구버전 동시 삭제 — removed: `<file path>`
- [x] (7) FE-only slug 격리 — `<lib/voc-{domain}-slug.ts path>` (or N/A — 사유)

### 변경 요약
- (브리프 description)
```

플레이스홀더 안내:

- `<short-sha>`: 7자 git SHA
- `<grep cmd>`: 실행한 명령 + "0 hits" 한 줄 결과
- `<harness PASS line>`: visual-diff 출력 중 SKIP 0 PASS line 발췌

## 5. C-2 (VocPriorityBadge) 적용 메모

- 슬러그(C1.D2/§3 (7)): prototype·BE 모두 영문 union(`urgent | high | medium | low`) → **N/A**.
- a11y(C1.D5): outer node `aria-label="우선순위 ${priority}"`, icon `aria-hidden`.
- 그 외 항목 (1)~(6) 모두 강제.

### 5.1 신규 토큰 도입 정책 (leaf PR vs Phase B addendum)

leaf PR이 도입하려는 신규 토큰이 있으면 다음 중 하나로 처리한다.

| 도입 규모                        | 처리                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| 컴포넌트 1개 전용 (≤3 토큰)      | leaf PR에 함께 포함 가능. 단 PR 설명에 "신규 토큰 N개" 명시 + uidesign.md §10/§12 동시 갱신. |
| 2개 이상 컴포넌트 공유 (≥4 토큰) | **별도 Phase B addendum PR로 분리**. leaf PR은 token PR 머지 후 시작.                        |

> 임계값(≤3 vs ≥4)은 휴리스틱. **공유 family 토큰**(예: `--priority-{urgent,high,medium,low}` 4종)이 우연히 ≤3개로 보여도 가까운 시점에 다른 컴포넌트가 사용할 예정이면 ≥4로 간주하고 분리한다. 작성자가 판단 어려우면 reviewer에게 명시 질의.

C-2 예: VocPriorityBadge가 prototype의 `--status-orange/-bg/-border` 3종을 도입 → ≤3 토큰 + 컴포넌트 전용 → leaf PR 동봉 OK. uidesign.md §10/§12 동시 갱신 필수.

## 6. 변경 이력

- 2026-05-02 — 초안 작성 (Wave 1.6 Phase C-1 PR #129 merge 직후, critic Q3 follow-up)
- 2026-05-02 — 3-reviewer 결과 반영: C1.D5(a11y) + C1.D6(barrel import) 추가, §3 N/A 절·플레이스홀더 안내·§5.1 신규 토큰 정책 신설, ID 네임스페이스(C1.Dn) 명시
