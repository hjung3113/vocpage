# 0008 — Flowline 디자인 정합화

## Status

Proposed (2026-05-10). 본 ADR 잠금 후 `uidesign.md §16` 신설 PR 진입.

## Context

`refSystem/Integrated Platform _ Standalone.html` 은 통합 플랫폼 시각 레퍼런스이다. 그 내부 모듈 중 **Flowline** (Linear-flavored 이슈/태스크 모듈, CSS 위치 lines 835–1079) 의 완성도가 가장 높다는 판단으로, vocpage **전체** (VOC 리스트·상세·admin·dashboard·shell) 가 Flowline 과 같은 패밀리로 인식되도록 시각 정합화한다. 픽셀 동일이 아니라 **형제 시스템 인식**이 목표.

`docs/specs/plans/flowline-alignment-cues.md` 가 시그널 7개와 OQ 5건을 정리했고 OQ 전건 해소 완료.

### OQ resolutions (cues §3)

- S2 status glyph: 보완(좌측 prepend), 텍스트 유지.
- S4 row density: VocRow 가 이미 Flowline 사양과 동일(`7px 24px / 36px / 13px / gap 10px`). 코드 변경 불필요.
- S6 avatar stack: 하향(VOC 다중 담당자 없음). label-chip 만 유지.
- S7 활동 피드: 기존 `VocActivityTimeline` 활용. 시각 정합성은 별 wave.
- 적용 범위: Flowline 시그널 7개 + dashboard primitives. dashboard 는 `uidesign.md §11` 우선.

### 결정 분기

- **A (선택)** — Flowline 시그널 5개 (S1·S2·S3·S5·S6 label-chip) 만 신규 컴포넌트 명세, S4·S7 는 verified-aligned 명시, dashboard 는 §11 그대로.
- B — 7개 전부 신규 명세 (S4·S7 중복).
- C — refSystem 시각 참고만, 명세 없음.

## Decision

### A 채택. 다음을 확정:

1. **목표**: vocpage 가 Flowline 과 형제 시스템으로 인식되는 시각 통일감. 픽셀 일치·기능 일치 아님.
2. **패러다임**: shadcn 유지 + variants. 신규 시그널은 `frontend/src/shared/ui/<name>` React 컴포넌트로 추가. refSystem 의 시맨틱 클래스(`.iid`, `.s-icon` 등)는 **참고용**, 런타임 적용 금지.
3. **신규 컴포넌트 5종** (사용처 발생 시 컴포넌트화):
   - `issue-id` (S1) — VOC ID, 사용자 ID, 태그 ID 의 mono 칩.
   - `status-glyph` (S2) — 14×14 원형 글리프, SolidChip 좌측 prepend 용.
   - `priority-bars` (S3) — 14×14 3-bar, urgent/high/med/low.
   - `list-group-header` (S5) — 리스트 그룹 라벨 밴드.
   - `label-chip` (S6) — 기존 OutlineChip 의 `dot-pill` variant 추가 (신규 컴포넌트 아님, variant 확장).
4. **변경 없음 명시**:
   - S4 row density: `VocRow.tsx:35` 가 이미 사양 동일. 검증만.
   - S7 활동 피드: 기존 `VocActivityTimeline` 유지. 시각 정합성 점검은 별 wave.
   - 토큰: `globals.css` 변경 없음 (Flowline CSS 의 모든 token reference 가 이미 globals.css 에 존재).
5. **Dashboard primitives**: `uidesign.md §11` 이 KPI / Heatmap / Donut 을 이미 명세. Flowline `.sparkline` 만 §16 에 추가 (§11 Donut 옆 미니 bar 패턴과 통합 가능).
6. **사용 게이트**: `uidesign.md §16` 등재 항목만 ad-hoc 컴포넌트화 허용. 기타 Flowline CSS 클래스(`.kanban`, `.tl-grid` 등) 은 본 ADR 범위 외, 차후 사용처 발생 시 별 ADR.

### Rejected — B (7개 전부 신규 명세)

- S4 는 코드 검증 결과 이미 정렬, 명세 추가 = 중복.
- S7 는 기존 컴포넌트 보유, 시각 점검은 코드 변경 wave 가 더 적합.

### Rejected — C (참고만)

- 시그널 추출까지 한 시점에서 명세 없는 정합화는 spec drift 보장.

## Consequences

- **+** §16 가 Flowline 정합화의 단일 출처. 화면별 wave 가 §16 컴포넌트만 채택.
- **+** 신규 시그널 5개 모두 작은 atomic 컴포넌트 (각 ~30~50줄). 누적 영향 < 200 LOC.
- **+** 토큰 변경 0, 기존 컴포넌트 변경 0 (label-chip 은 OutlineChip variant 추가).
- **+** S4 자동 해결로 행 밀도 변경에 따른 visual-diff 베이스라인 22장 재촬영 회피.
- **−** 5개 컴포넌트 중 1차 사용처는 VOC 리스트(S1·S2·S3) 정도로 좁음. 나머지(S5·S6 dot-pill)는 사용처 발견까지 spec-only 상태. 완화: §16 표 "구현 상태" 컬럼 의무.
- **−** Flowline 모듈만 정합 기준이고 refSystem 내 Servey/Analytics 모듈은 미정. 향후 별 시스템(설문 도입 등) 추가 시 분기점 발생. 본 ADR 범위 외.

## Implementation outline

1. (본 PR) ADR-0008 + `uidesign.md §16 — Flowline Alignment Primitives` 신설 (S1·S2·S3·S5 명세, S4 verified, S6 label-chip dot-pill variant, S7 deferred, sparkline 1행).
2. (별 wave · 가벼움) `shared/ui/issue-id` + `shared/ui/status-glyph` 컴포넌트화 + VOC 리스트·drawer 1차 적용. visual-diff 베이스라인은 변경 페이지만 재촬영.
3. (별 wave) `priority-bars` + `list-group-header` 도입.
4. (수요 발생 시) S6 dot-pill variant, S7 활동 피드 시각 점검.

## Open Questions

- 없음 (cues OQ 5건 전건 해소).
