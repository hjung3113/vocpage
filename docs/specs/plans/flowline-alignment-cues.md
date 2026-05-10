# Flowline Alignment Cues

> **Status:** Draft (2026-05-10). Not a spec — a working queue.
> **Goal:** vocpage 전체가 refSystem 내 **Flowline** 모듈과 같은 패밀리로 인식될 정도의 디자인 통일감 확보. 픽셀 동일 아님, 기능 차이 허용.
> **Reference:** `refSystem/Integrated Platform _ Standalone.html` (decoded body 75KB; Flowline CSS = lines 835–1079, `tasks-shell.css — Linear-flavored extras`).
> **Scope of application:** vocpage 전체 (VOC 리스트·상세·admin·dashboard·shell). 기존 `uidesign.md` 토큰·팔레트·타이포는 이미 95% 동일이므로 **추가 시그널만** 정렬한다.

## 1. Family-resemblance signals (extracted)

Flowline 을 다른 시스템과 구분짓는 시각 시그널을 영향력 순으로 7개 추렸다. 같은 패밀리로 보이려면 1~5번이 가장 비싸고, 6~7은 보너스.

### S1 — Issue ID 칩 (`.iid`)
- 형태: `font-mono 11.5px / padding 1px 6px / radius 4px / bg var(--bg-elevated) / border var(--border-subtle) / color var(--text-tertiary) / letter-spacing 0.01em`
- 의미: 도메인 ID(`LIN-204`, `VOC-318`, `SV-22`)를 본문 텍스트와 분리해 시각 앵커로.
- vocpage 영향: VOC 행 ID, 어드민 사용자/태그 ID, 활동 피드 mention.

### S2 — Status glyph (`.s-icon`)
- 형태: 14×14 원형 / 1.5px ring / `backlog`(dashed) · `todo`(solid ring) · `progress`(60% conic amber) · `review`(80% conic blue) · `done`(filled emerald + check) · `canceled`(filled muted + ×).
- 의미: status를 **단어 없이도** 즉시 식별. 칩이 아니라 글리프라는 점이 Linear/Flowline 시그니처.
- vocpage 영향: 현 VOC `received|reviewing|processing|done|drop` 5상태 → 글리프 5종 매핑. 기존 SolidChip 텍스트 유지하되 좌측에 글리프 prepend.

### S3 — Priority bars (`.p-icon`)
- 형태: 14×14 / 3 bar (높이 4·7·10px, 너비 2.5px) / `urgent`(red 3) · `high`(orange 3) · `med`(secondary 2) · `low`(secondary 1).
- 의미: 텍스트 없이 우선순위 레벨 표현. 행 밀도 유지에 핵심.
- vocpage 영향: VOC 우선순위 컬럼이 현재 텍스트 또는 색칩이라면 글리프로 대체 검토.

### S4 — Tight row density (`.irow`)
- 형태: `grid-template-columns: 16px 22px 70px 1fr auto / gap 10px / padding 7px 24px / min-height 36px / font-size 13px`.
- 의미: glyph(s-icon) · iid · 중심 타이틀 · 우측 메타로 고정된 5-슬롯 행. 36px 행 높이가 Flowline 시그니처.
- vocpage 영향: `features/voc/list/ui/VocRow.tsx` 의 행 높이·컬럼 그리드 점검. 현 VOC 리스트가 더 여유 있으면 `compact` 모드 도입을 옵션으로.

### S5 — Group header band (`.igroup-h`)
- 형태: `padding 8px 24px / bg var(--bg-panel) / font 12px 600 / count 11px 500 tertiary / cursor pointer`.
- 의미: 리스트 그룹핑(상태별/담당자별) 라벨이 row와 시각 위계가 분명히 분리된다.
- vocpage 영향: VOC 리스트 카테고리 분리, admin 테이블 그룹핑.

### S6 — Label chip (`.label-chip`) & avatar stack (`.av-stack`)
- label-chip: `padding 1px 8px / radius pill / dot 7px / font 11.5px 500 / bg var(--bg-elevated)`.
- av-stack: `margin-left -6px / 2px solid var(--bg-surface) border` 로 겹침.
- 의미: 메타 정보가 아이콘+텍스트 일체형 칩으로 응축. 태그·할당자가 **밀도 있는 한 줄 메타**가 됨.

### S7 — Activity feed (`.act`)
- 형태: `gap 10px / padding 10px 0 / 마지막 외 border-bottom subtle / line 13px secondary line-height 1.55 / time 11px quaternary`.
- bold (`b`)는 `text-primary`로 객체(이슈 ID, 사용자명) 강조.
- 의미: VOC 상세 drawer의 활동 탭 = Jira/Linear 풍 피드.

### Bonus — `.kbd` (키보드 힌트), `.proj-pick` (프로젝트 picker), modal radius 12px

## 2. Mapping vs current vocpage

| Signal | 현 vocpage 위치                                          | 갭 평가                                    |
| ------ | -------------------------------------------------------- | ------------------------------------------ |
| S1 iid | (없음 — VOC ID는 plain text)                              | **신규** `shared/ui/issue-id` 도입        |
| S2 s-icon | `shared/ui/badge/SolidChip.tsx` (텍스트 only)         | **신규** `shared/ui/status-glyph`          |
| S3 p-icon | `shared/ui/badge/` priority semantic wrapper          | **신규** `shared/ui/priority-bars` 또는 기존 우선순위 칩에 glyph variant |
| S4 row density | `features/voc/list/ui/VocRow.tsx`                | **점검** 현 행 높이·padding 측정 후 결정 |
| S5 group band | (없음)                                               | **신규** `shared/ui/list-group-header`     |
| S6 label-chip | `shared/ui/badge/OutlineChip.tsx`, `avatar.tsx`     | **부분** OutlineChip variants에 `dot-pill` 추가 / avatar stack 미존재 |
| S7 act | (활동 탭 존재 여부 미확인)                                | **확인** VOC drawer 활동 탭 현황 → variant 또는 신규 |

## 3. OQ resolutions (2026-05-10)

- **OQ-1 → 보완(좌측 prepend)**: S2 status glyph는 SolidChip 텍스트 유지 + 좌측에 14×14 글리프 prepend. 한국어 사용자 가독성 유지.
- **OQ-2 → 자동 해결**: `VocRow.tsx:35` 주석에 이미 `padding 7px 24px / min-height 36px / font-size 13px / gap 10px` 명시. Flowline 사양과 동일. **코드 변경 불필요**.
- **OQ-3 → S6 stack 하향**: VOC에 다중 담당자 케이스 없음. label-chip만 S6에 유지, avatar stack 본 wave 제외.
- **OQ-4 → 기존 자산 활용**: `features/voc/review/ui/VocActivityTimeline.tsx` + `ActivityAvatar.tsx` + `VocHistory.tsx` 이미 존재. S7는 시각 정합성 점검만 별 wave.
- **OQ-5 → dashboard primitives 포함**: kpi / donut / sparkline 까지 Flowline 정합화 범위에 포함. 단 기존 `uidesign.md §11 Dashboard Components` 와 충돌하면 §11 우선.

## 4. Wave proposal (after OQ resolution)

1. **Wave A · 토큰 갭 0건** — 현 globals.css 가 이미 모든 토큰 보유. 추가 토큰 불필요. ✅
2. **Wave B · ADR + 시그널 5개 명세** — S1~S5 만 우선 ADR + uidesign.md 추가 (S6·S7 보류).
3. **Wave C · S1·S2 컴포넌트** (가장 가벼움) — `issue-id` + `status-glyph`, VOC 리스트·drawer 1차 적용.
4. **Wave D · S3·S4·S5** — priority-bars + 행 밀도 조정 + group band. 시각 회귀 영향 큼, visual-diff 베이스라인 재촬영.
5. **Wave E · S6·S7** — OQ-3·4 결과에 따라.

## 5. Out of scope (본 문서 의도적 제외)

- Kanban (`.kanban` / `.kcard`) — VOC에 board 화면 없음.
- Roadmap timeline (`.tl-grid`) — VOC에 일정 화면 없음.
- Dashboard primitives (kpi / donut / sparkline) — `uidesign.md §11` 이 이미 다루므로 별도.
- refSystem 내 Servey / Analytics / Console 모듈 시각 — Flowline 으로 한정.

## 6. References

- Flowline CSS: `refSystem/Integrated Platform _ Standalone.html` lines 835–1079 (decoded body).
- 디자인 컨텍스트: `.impeccable.md`.
- 기존 토큰: `frontend/src/shared/styles/globals.css` (변경 없음).
- 기존 UI: `frontend/src/shared/ui/badge/`, `frontend/src/features/voc/list/ui/VocRow.tsx`.
