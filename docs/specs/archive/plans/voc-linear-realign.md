# VOC Linear-style Realignment Plan

> 목적: `feat/voc-review-ui-linear-jira` 브랜치에서 진행 중이던 "Linear/Jira 시각 정렬" 작업을 정식 plan으로 승격하고, 픽셀 단위 정합성을 다시 잡는다.
> 인덱스 규칙: `docs/specs/README.md §7`. Wave 계보: `wave-index.md`.
> 본 plan은 Wave 1.6 Phase C와 직교 — 동일 화면(`/voc`)의 시각 정합 보강이지만 컴포넌트 트리 재구성과는 별개의 정합 패스.

## 0. 배경

- 이전 세션이 "Sidebar / VOC Row / Topbar / Filter bar Playwright 측정 100% 일치"를 보고했으나, 사용자 검수에서 "사이드바부터 테이블·테이블헤더·버튼 크기·테이블 아이템 다 개판"으로 판정.
- 이전 세션의 측정 기준은 `prototype/` 였음. 이번 plan의 정합 기준은 **`servey_Remix/App.html` (http://localhost:8000/App.html)** 로 변경.
- 이전 변경분은 `git stash` (`WIP: pre-impeccable-realign — claimed 100% match but mismatched per user`)에 보관. 깨끗한 상태에서 재측정 후 재구현.

## 1. 결정 (잠금) — 2026-05-07

| ID  | 항목                    | 결정                                                                                           |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| L1  | 정합 기준               | `servey_Remix/App.html` (벤치마크) — `prototype/` 아님                                         |
| L2  | 작업 범위               | List + Review + Create 3개 화면 동시 + 공통 셸(Sidebar / Topbar / Filter)                      |
| L3  | 측정 방식               | Playwright DOM/CSS diff 우선 (구조 → 토큰 → 픽셀 순). 픽셀 스크린샷 diff는 최종 검증에만       |
| L4  | 아이콘 정책             | List 행: status/priority/issue-type **icon-only**. Review 정보탭: issue-type만 **icon + text** |
| L5  | 아이콘 셋               | 벤치마크 사용 셋 확인 후 결정 (lucide-react 우선 검토)                                         |
| L6  | 토큰 정책               | 기존 룰 동일 — `var(--*)` 전용, hex/raw OKLCH 금지                                             |
| L7  | shadcn/ui 기존 컴포넌트 | 유지. 이미 추가된 sidebar/sheet/tooltip 등은 보존, 필요 시 wrapping/재합성으로 정합            |
| L8  | Phase 4 (status 그룹)   | **포함** — 정합성 정리 후 마지막 Phase에서 진행 (사용자 결정, 2026-05-07)                      |
| L9  | PR 분리                 | 화면별 3개 (Sidebar+Topbar / List Table / Review) + Phase 4 1개                                |
| L10 | 자동화 정책             | subagent 병렬 허용 (Explorer/Designer/QA/Reviewer). 머지·완료 선언은 사용자 검수 후            |

## 2. 페이즈 흐름

```
Phase 1: 격차 측정 (코드 0줄)
  └─ Explorer subagent: 벤치마크 vs 현재 DOM/CSS diff → /tmp/voc-gap-report.md
  └─ 사용자 승인 게이트 ─┐
                        ▼
Phase 2: 공통 셸 정합 (Sidebar + Topbar + Filter bar)
  └─ Designer/Executor subagent — 격차표 P0/P1 항목 fix
  └─ 사용자 승인 게이트 ─┐
                        ▼
Phase 3: List Table 정합 (row + status/priority/issue-type icon)
  └─ Designer/Executor subagent
  └─ 사용자 승인 게이트 ─┐
                        ▼
Phase 4: Review 페이지 정합 (좌 본문 + 우 프로퍼티 패널)
  └─ Designer/Executor subagent
  └─ 사용자 승인 게이트 ─┐
                        ▼
Phase 5: Status별 collapsible 그루핑 (List)
  └─ Designer/Executor — Sprint(Active)/Backlog 그룹 헤더 + Collapsible
  └─ 사용자 승인 게이트 ─┐
                        ▼
Phase 6: 종합 검증
  ├─ QA-Tester: Playwright pixel diff 재측정
  └─ Code-Reviewer (opus): 토큰·컴포넌트 일관성 리뷰
```

## 3. Phase 4 (E2) — Status별 Collapsible Grouping

### 3.1 사용자 결정 (E2 = 포함)

사용자는 본 정합성 작업과 함께 Phase 4(=Phase 5, status 그루핑)를 **포함** 진행하기로 결정.

### 3.2 Claude 의견 (E1 = defer 선호) — 기록 목적

원안은 **defer (E1)** 였음. 이유:

1. 정합성이 안 맞은 상태에서 그루핑을 얹으면 격차 원인이 (구조 정렬 미흡 vs 그루핑 도입 부작용) 중 어디인지 분리 불가.
2. 그루핑은 list 컴포넌트 트리 변경 — 정합 PR과 섞이면 refactor + feature 동시 진행 룰 위반(`CLAUDE.md` "Refactoring" §).
3. 정합 PR(Phase 2~4)을 먼저 머지 후 그루핑은 별도 PR에서 진행하면 회귀 추적 용이.

### 3.3 결정 반영 — 분리 운영

- E2 채택했으되, **Phase 5에서 별도 PR로 분리**해 정합과 그루핑 변경이 같은 PR에 섞이지 않도록 함 (룰 충돌 회피).
- Phase 1~4 머지 → Phase 5 진입.

### 3.4 그루핑 사양 (참고용 초안 — 진입 시 spec 확정)

- 그룹 헤더: status별 (received / reviewing / processing / done / drop) — 또는 sprint-style (Active / Backlog) — 벤치마크 패턴 확인 후 결정
- Collapsible 컴포넌트: shadcn `Collapsible` 사용
- 그룹 헤더에 status 아이콘 + 카운트 표시
- 접힘 상태는 localStorage 영속화

## 4. Subagent 배치

| 단계      | Agent                    | Model  | 역할                                    |
| --------- | ------------------------ | ------ | --------------------------------------- |
| Phase 1   | Explore                  | sonnet | DOM/CSS 측정 + 격차표                   |
| Phase 2~5 | Executor (또는 Designer) | sonnet | 화면별 정합 fix (병렬 가능 영역만 병렬) |
| Phase 6 a | qa-tester                | sonnet | Playwright pixel + DOM diff 재측정      |
| Phase 6 b | code-reviewer            | opus   | 토큰·컴포넌트 일관성 최종 리뷰          |

## 5. 검증 게이트 (각 Phase 종료 시)

- typecheck PASS
- vitest PASS (회귀 0)
- 해당 Phase 영역 격차표 항목 모두 closed (또는 P2/P3로 강등 + 사유 기록)
- 사용자 시각 검수 통과

## 6. 산출물 위치

- 격차 리포트: `/tmp/voc-gap-report.md` (Phase 1)
- 본 plan: `docs/specs/plans/voc-linear-realign.md`
- 진행 로그: `claude-progress.txt` 갱신
- Phase별 PR 4개 (Phase 2 / Phase 3 / Phase 4 / Phase 5)

## 7. 참고

- 이전 잘못된 측정 결과: `/tmp/voc-progress.md` (보존, 재측정 후 폐기)
- 벤치마크 소스: `/Users/hyojung/Desktop/2026/servey_Remix/App.html` 외
- stash: `git stash list | grep pre-impeccable-realign`
