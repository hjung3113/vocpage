# Wave Index

> Phase 8 wave 계보 + batch glossary 한 장 인덱스. 신규 진입자가 본 문서 한 장으로 배경 파악 후 활성 plan으로 진입.
> 정본 진행 포인터: `claude-progress.txt` 첫 30줄. 본 문서는 historical map.

## Wave 계보

| Wave    | 범위 (한 줄)                                                                                                  | 상태                     | 정본 plan                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| 0       | Foundation (shared, shadcn, TanStack Query, MSW, AppShell, Zod, ESLint, CI)                                   | ✅ PR #102               | [`phase-8.md`](./phase-8.md)                                                                   |
| 1       | 기준 화면 — VOC 리스트 + 검토 드로어 vertical slice + RTL 보강                                                | ✅ PR #110~#114          | [`phase-8.md §Wave 1`](./phase-8.md)                                                           |
| **1.5** | Wave 1 보강 — `/voc` 시각 동등화 + Playwright e2e (token-only)                                                | ✅ PR #125               | (archive: `wave1.5-followup-a-*`)                                                              |
| **1.6** | `/voc` prototype 100% 일치화 — Phase A 분해 / B 토큰 / C 컴포넌트 rebuild 19 + η 4 (2026-05-04 추가) / D 검증 | 🟡 진행 중 (Phase C δ→η) | [`wave-1-6-voc-parity.md`](./wave-1-6-voc-parity.md) + [룰북](./wave-1-6-phase-c-precedent.md) |
| **1.7** | VOC 등록 모달 정합화 — A spec → B BE → C FE → D visual                                                        | 🟡 Phase A 머지          | [`wave-1-7-voc-create-modal.md`](./wave-1-7-voc-create-modal.md)                               |
| 2       | Dashboard + 위젯 8종                                                                                          | ⛔ Wave 1.6 종료 후      | (예정)                                                                                         |
| 3       | Admin 4 화면 (Tag Master / Trash / External Masters / Users)                                                  | 대기                     | (예정)                                                                                         |
| 4       | 공지/FAQ + Notice popup                                                                                       | 대기                     | (예정)                                                                                         |
| 5       | 알림 + 셸 마감 + 시각 회귀 12 화면                                                                            | close gate               | (예정)                                                                                         |

> **Decimal Wave 주의**: 1.5/1.6/1.7은 grandfather. 본 인덱스 규칙(R1) 적용 이후 추가되는 wave는 정수 (Wave 6, 7…) 로 진행.

## Batch Glossary (Wave 1.6 Phase C 한정)

> Wave 1.6 Phase C는 19 rebuild를 6 batch + addendum + audit으로 묶음. **batch 라벨은 plan doc 표 안의 grouping 메타데이터일 뿐 ID 아님** (R3).

| Batch | 의미                                                  | 컴포넌트 (leaf)                                                                                       |
| ----- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| α     | Badge primitive + leaf 컴포넌트 (의존성 가장 적음)    | C-2.6 / C-3 / C-4 / C-5 / C-6 / C-7 (+ pre-α: C-2.5 audit / B-add-2 chip 토큰)                        |
| β     | Sort / Filter / Notification (서로 독립, 3 슬롯 병렬) | C-8 / C-9 / C-10                                                                                      |
| γ     | Modal + atom 동봉                                     | C-11                                                                                                  |
| **δ** | **Drawer shell + flat-section refactor (sequential)** | **C-12** ✅ / **C-13** ⏳ (rename: VocReviewTabs → VocReviewSections, 탭 폐기)                        |
| ε     | Drawer 본문 컴포넌트 (3 슬롯 병렬)                    | C-14 / C-15 / C-16                                                                                    |
| ζ     | Sidebar / Topbar (sequential — popover 의존)          | C-17 / C-18 / C-19                                                                                    |
| η     | Drawer 추가 섹션 (4 슬롯 병렬, prototype 일치)        | C-20 VocTagPills / C-21 VocActivityTimeline / C-22 VocAttachmentUploadZone / C-23 VocErrorSimSelector |

Phase D = 종합 검증 (visual-diff SKIP 0, E2E 그린, 토큰 lint, 사용자 최종 승인).

> **Greek batch 주의**: α/β/γ/δ/ε/ζ는 **post-hoc grouping**으로 부착됨. 본 인덱스 규칙(R3) 적용 이후 신규 grouping은 plan 표의 column으로만 노출, ID 자체에 부착 금지.

## Cross-Wave Follow-up

머지된 wave에서 발견된 후속 작업은 wave 자체가 아니라 [`followup-bucket.md`](./followup-bucket.md) 의 `FU-NNN` flat ID로 흐른다 (R6).

## ID 규칙 (요약)

본 프로젝트 ID 부여 규칙은 [`docs/specs/README.md §7`](../README.md) 참조. 핵심:

- Wave / Task ID는 append-only 정수 (decimal/sub-decimal 금지 — R1·R2)
- Grouping은 메타데이터, ID 아님 (R3)
- Issue# / Bundle 명은 cross-ref column 또는 PR description (R4·R5·R7)
- 닫힌 wave에 task 추가 X — `FU-NNN` bucket으로 (R6)

## 진행 포인터

- 다음 작업 → `claude-progress.txt` 첫 30줄
- 활성 wave 상세 → 위 표의 정본 plan
- Follow-up 누적 → `followup-bucket.md`
- 누적 이력 → `progress-archive.md`
