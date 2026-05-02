# Wave 1.6 — /voc Prototype Parity Plan

> 목적: prototype의 시각·동작 기준에 production /voc 화면을 100% 맞춘다.
> Wave 1.5 Follow-up A (PR #125)에서 token-only 정렬로 부족했음이 확인됨 — 이번엔 **DOM 구조 단위 재구성**으로 접근한다.

## 1. 배경

- Wave 1.5는 `var(--*)` 토큰 정렬 + visual-diff harness 도입까지 완료. 9 SKIP 잔존.
- 잔존 격차의 원인은 토큰이 아니라 **컴포넌트 DOM 구조와 합성 단위가 prototype과 다르기 때문**으로 판단.
- 따라서 Wave 1.6은 token tuning이 아니라 **prototype 시각 위계 기준의 컴포넌트 트리 재구성**을 목표로 한다.

## 2. 원칙

1. prototype의 HTML/CSS/JS 코드를 직접 이식하지 않는다 (governance: `CLAUDE.md` "Never copy prototype code directly").
2. 복사 대상은 **시각 구조와 인터랙션 명세**이지 코드가 아니다.
3. 데이터 hook·store·타입·MSW 핸들러는 production 기존 자산을 재사용한다.
4. 스타일은 항상 `var(--*)` CSS 토큰을 통한다 (raw hex/OKLCH 금지).
5. refactor와 feature 변경은 같은 PR에 섞지 않는다.

## 3. 결정 (잠금)

| ID  | 항목                | 결정                                                                                              |
| --- | ------------------- | ------------------------------------------------------------------------------------------------- |
| D1  | 분해 범위           | `/voc` 페이지 + 그 페이지가 사용하는 공통 셸(AppShell, Header, Sidebar)                           |
| D2  | prototype 기준 자료 | `prototype/prototype.html` + `prototype/css/**` + `prototype/js/**` 전부. 분석은 subagent 병렬    |
| D3  | 분해 산출물 위치    | `docs/specs/requires/voc-prototype-decomposition.md` (신규)                                       |
| D4  | 컴포넌트 맵 위치    | 동일 문서 §5 섹션                                                                                 |
| D5  | 재구성 결정 기준    | prototype DOM 트리 ↔ production JSX 트리 노드 단위 비교. 다르면 rebuild, 같으면 token-align reuse |
| D6  | Phase 게이트        | 각 Phase 종료 시 사용자 승인 없으면 다음 Phase 시작 금지                                          |
| D7  | diff 임계           | data-pcomp 자손 포함 SKIP 0 + 컴포넌트별 픽셀 diff 임계는 Phase A에서 prototype 캡처 보고 확정    |
| D8  | 기존 컴포넌트 폐기  | rebuild 컴포넌트는 신규 작성 → 호출부 교체 → 같은 PR에서 구버전 삭제                              |
| D9  | PR 단위             | Phase A 1 PR / Phase B 1 PR / Phase C 컴포넌트당 1 PR / Phase D 종합 1 PR                         |
| D10 | 자동화 정책         | Phase 진행 중 autopilot/ralph 사용 허용. **머지·완료 선언은 사용자 검수 후에만**                  |

## 4. Phase 흐름

```
Phase A: 분해 산출물 작성 (코드 0줄)
  ├─ subagent×3 병렬 분석 (HTML 구조 / CSS 토큰·상태 / JS 인터랙션)
  └─ 사용자 승인 게이트 ──┐
                          ▼
Phase B: 토큰 갭 채우기
  ├─ uidesign.md + tokens 추가 (var(--*) 형태만)
  └─ 사용자 승인 게이트 ──┐
                          ▼
Phase C: 컴포넌트 재구성 (rebuild 항목을 1개씩)
  ├─ TDD: visual-diff·E2E·unit 먼저 작성
  ├─ 컴포넌트별 PR + 사용자 검수
  └─ 모든 컴포넌트 통과 ──┐
                          ▼
Phase D: 종합 검증
  ├─ /voc 전체 visual-diff (data-pcomp 자손 포함) SKIP 0
  ├─ E2E 그린, 토큰 lint 통과
  ├─ claude-progress.txt + next-session-tasks.md 갱신
  └─ 사용자 최종 승인 → Wave 1.6 완료
```

## 5. Phase A 상세

### 5.1 산출물

`docs/specs/requires/voc-prototype-decomposition.md` 한 파일.

```
§1 페이지 인벤토리 — /voc 화면, 모달, 라우트
§2 공통 셸 분해 — AppShell / Header / Sidebar DOM 트리·토큰·spacing
§3 /voc 페이지 분해 — 영역별 DOM 트리 + 토큰 + 상태(hover/focus/active/loading/empty/error) + 인터랙션
§4 데이터 계약 — 영역별 소비 TS 타입 매핑, 누락 필드 명시
§5 컴포넌트 맵 — 표(컴포넌트·역할·props·상태·variants·prototype 위치·production 위치·처리)
§6 토큰 갭 — prototype에 있고 uidesign.md에 없는 토큰 목록
§7 검증 임계 — 컴포넌트별 픽셀 diff 허용치, SKIP 0 정의
```

### 5.2 Subagent 작업 분담 (병렬)

세 에이전트를 동시 실행 후 메인 컨텍스트에서 합본.

| Agent                   | 입력                                                                                                              | 산출                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **HTML structure**      | `prototype/prototype.html`의 /voc 관련 섹션 + 공통 셸 영역                                                        | 영역별 DOM 트리 발췌 + 클래스 인벤토리                                                |
| **CSS tokens & states** | `prototype/css/tokens.css`, `prototype/css/base.css`, `prototype/css/layout/*`, `prototype/css/components/*`      | 토큰 사용 매핑, hover/focus/active/disabled rule 인벤토리, spacing/radius/shadow 추출 |
| **JS interactions**     | `prototype/js/voc-list.js`, `filters.js`, `drawer*.js`, `modal.js`, `data.js`, `helpers.js` 등 /voc 관련 스크립트 | 인터랙션 명세 (이벤트→상태 전이), 모달 트리거, 데이터 형태 추정                       |

각 agent는 **결과 markdown 단편**만 반환한다 (raw 코드 인용 금지, 위치 참조만 — `prototype.html:L1234-L1280` 형태). 메인 컨텍스트에서 §1~§7 구조에 맞춰 합본.

### 5.3 게이트 통과 조건

- 컴포넌트 맵에 처리 라벨(reuse / token-align / rebuild / delete) 빠짐 없음
- §7 임계 표가 존재하고 컴포넌트별 항목이 빠짐 없음 (Phase A에서는 잠정 추정값 허용 — 실측 캘리브레이션은 Phase B 종료 직후 별도 단계에서 수행)
- 사용자 승인

## 6. Phase B 상세

- §6 토큰 갭만 채운다. 컴포넌트 코드 변경 금지.
- `frontend/src/styles/tokens.css` (또는 동등 위치) + `docs/specs/requires/uidesign.md` §10·§12 동시 갱신.
- raw hex/OKLCH 직접 등장 금지 — 토큰 정의부 외에는 모두 `var(--*)`.
- 게이트: 토큰 lint 통과 + 사용자 승인.

## 7. Phase C 상세

- §5 컴포넌트 맵의 `rebuild` 항목을 한 번에 1개씩 처리.
- 순서: 의존성 적은 leaf → 합성 컨테이너 → AppShell.
- 컴포넌트당 절차:
  1. visual-diff 기대값 갱신 (자손 노드 포함)
  2. E2E selector 영향 점검
  3. 신규 컴포넌트 작성 (TDD: unit 먼저)
  4. 호출부 교체 + 구버전 삭제 (같은 PR)
  5. visual-diff·E2E·unit 그린 확인
  6. 사용자 검수 → 머지

### 7.1 즉시 중단 조건

- 컴포넌트 1개 rebuild가 200줄 초과 → 더 작게 쪼개거나 디자인 단순화 협의
- 임계 미달 컴포넌트 누적 3개 → Phase 중단, 원인 분석

### 7.2 Batch 실행 순서 (병렬 슬롯)

원칙: 코딩은 병렬, 머지는 순서대로. 같은 파일 충돌 회피 + 의존성 역피라미드.

총 19 rebuild 잔여 (C-1 VocStatusBadge 완료, PR #129). C-2 VocPriorityBadge 완료, PR #136.

**Pre-α 삽입 (badge primitive layer):**

| Step        | 내용                                                                                                                              | 의존                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **C-2.5**   | VOC Badge Audit & Archetype Lock (docs PR — **이 PR**)                                                                            | C-2 머지 후          |
| **B-add-2** | `--chip-*` 7개 토큰 추가 (Phase B addendum) — `index.css` + `uidesign.md §13`                                                     | C-2.5 사용자 승인 후 |
| **C-2.6**   | Primitive layer 구현 (TextMark / OutlineChip / SolidChip) + VocStatusBadge·VocPriorityBadge 래퍼 리팩터 + VocTypeBadge 신규 (TDD) | B-add-2 머지 후      |

C-3(VocTagPill)은 C-2.6 머지 전 시작 불가. C-4(VocSubRow)는 C-2.6 래퍼 완료 후 진입.

| Batch | 컴포넌트 (PR 번호 leaf id)                                                                                                              | 병렬도     | 의존·메모                                                                                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **α** | C-2.6 primitive+refactor+VocTypeBadge → C-3 VocTagPill ∥ C-4 VocSubRow → **B-add-1** → C-5 VocAssignee → C-6 VocListHeader → C-7 VocRow | 2 슬롯     | C-2.6 단독 머지 후 C-3·C-4 동시. C-5는 avatar colorCls 6 토큰 → §5.1 ≥4 → **Phase B addendum 별도 PR(B-add-1) 선행 필수**. C-6/C-7은 VocTable.tsx 충돌로 sequential closer |
| **β** | C-8 VocSortChips ∥ C-9 VocAdvancedFilters ∥ C-10 NotifButton+NotifPanel                                                                 | 3 슬롯     | 서로 다른 파일·의존 0                                                                                                                                                      |
| **γ** | C-11 VocCreateModal+AttachmentZone                                                                                                      | 1          | atom 동봉 1 PR. 200줄 초과 시 분할 (§7.1)                                                                                                                                  |
| **δ** | C-12 VocReviewDrawer → C-13 VocReviewTabs                                                                                               | sequential | δ shell 의존                                                                                                                                                               |
| **ε** | C-14 VocCommentList ∥ C-15 VocInternalNotes ∥ C-16 VocSubTaskList                                                                       | 3 슬롯     | δ 머지 후 진입                                                                                                                                                             |
| **ζ** | C-17 SidebarUserSwitcher → C-18 Sidebar ∥ C-19 Topbar                                                                                   | 2 슬롯     | C-18은 C-17 popover 의존. C-19는 **β의 NotifButton 머지 후** 시작 (props 충돌 회피)                                                                                        |

- **AppShell**은 token-align 분류이므로 Phase C rebuild 대상 아님. Phase D 종합 검증에서 일괄 점검.
- Critical path (sequential): C-2.5 → B-add-2 → C-2.6 → B-add-1 → C-5 → C-7 → C-11 → C-12 → C-13 → C-19. ≈ 10 단계.
- 총 PR 수: rebuild 19 PR + addendum 2 PR (B-add-1, B-add-2) + audit 1 PR (C-2.5) = **22 PR**. 추정 6~10 세션.
- D9(컴포넌트당 1 PR) 유지. 병렬 슬롯이라도 PR은 별도.

### 7.3 Batch 진입·종료 게이트

- **C-3 진입 게이트 추가**: C-3는 C-2.6 머지 전 시작 불가 (OutlineChip primitive 의존).
- **C-4 진입 게이트 추가**: C-4는 C-2.6 래퍼 리팩터 완료 전 시작 불가 (VocTypeBadge 의존).
- Batch 진입: 직전 Batch 마지막 PR 머지 + 사용자 검수 통과.
- Batch 내 병렬 슬롯: 각 PR 독립 TDD RED→GREEN, 같은 Batch 내 머지 순서는 충돌 없는 한 자유.
- Batch 종료 보고: Batch 끝날 때 progress.txt 갱신 + 다음 Batch 첫 leaf 명시.

## 8. Phase D 상세

- AppShell token-align 일괄 점검 (Phase C rebuild 대상 외 token-align 7종 모두 포함)
- /voc 전체 visual-diff (data-pcomp 자손 포함) SKIP 0
- E2E 전체 그린
- 토큰 lint 통과 (`grep -rE '#[0-9a-fA-F]{3,8}\b' src/` → 0 hits, 토큰 정의부 제외)
- `claude-progress.txt` + `docs/specs/plans/next-session-tasks.md` 갱신
- 사용자 최종 승인 → Wave 1.6 완료, Wave 2 + Follow-up C-2 hard-block 해제

## 9. 작업량 추정

| Phase | 추정           | 비고                                |
| ----- | -------------- | ----------------------------------- |
| A     | 1 세션         | subagent 병렬 후 합본               |
| B     | 0.5 세션       | 토큰만                              |
| C     | N × 0.5–1 세션 | N은 Phase A 종료 시 확정. 추정 8~15 |
| D     | 1 세션         | 검증·문서                           |

## 10. 위험과 대응

| 위험                                 | 신호                                  | 대응                                                        |
| ------------------------------------ | ------------------------------------- | ----------------------------------------------------------- |
| 컴포넌트 맵이 50개 초과              | Phase A 종료 시 표 행 수              | 범위 축소 재협상                                            |
| prototype과 데이터 모델 불일치       | §4에서 누락 필드 다수                 | 스키마 변경 협의 또는 prototype 추정값 reject               |
| visual-diff 자손 확장 후 노이즈 폭증 | Phase B 끝 캘리브레이션에서 SKIP 폭주 | 임계 재조정 또는 측정 대상 화이트리스트 도입                |
| 자동화로 진행 중 잘못된 머지         | PR이 사용자 검수 전 자동 머지         | merge 권한은 항상 사용자에게만, 자동화는 PR open까지만 수행 |

## 11. 참조

- 정본 governance: `CLAUDE.md`
- 디자인 시스템: `docs/specs/requires/uidesign.md` §10·§12
- 기능 요구: `docs/specs/requires/requirements.md`
- 직전 Wave 회고: PR #125 (Wave 1.5 Follow-up A)
- prototype 가이드: `prototype/CLAUDE.md`
