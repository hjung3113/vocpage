# Follow-up Bucket

> 닫힌 wave에서 발견된 후속 작업의 단일 누적 위치. ID 규칙: `FU-NNN` flat global, append-only (R6).
> 정본: 본 파일. 인덱스 규칙은 [`docs/specs/README.md §7`](../README.md). Wave 계보는 [`wave-index.md`](./wave-index.md).

## 운영 룰

- **신규 follow-up 발견 시** → 다음 정수 `FU-NNN` 부여 + 아래 표에 row 추가. 절대 기존 wave 의 C-N 시퀀스에 끼우지 않는다.
- **여러 wave 에 걸친 follow-up** → 한 행, `Trigger` column 에 spawn wave + cite line 명시.
- **PR 머지 시** → `Status` ✅, `Resolution` column 에 PR# / 한 줄 결과 기록. 본 행은 그대로 유지 (archive 로 옮기지 않음 — 누적 인덱스로 본 파일 자체가 영구).
- **후속이 다른 follow-up 을 낳으면** → 새 `FU-NNN` 추가, `Trigger` 에 원 FU 명시 (`FU-003 from FU-001`).
- **bucket 으로 들어오는 조건** = 닫힌 wave 와 관련된 추가 작업. 활성 wave 내부 발견 sub-task 는 그 wave 의 다음 정수 task ID (R2) 로 흡수, bucket 진입 X.
- **추적 단순화** — `Open` 상태 row 는 활성 plan (`next-session-tasks.md`) 에서도 한 줄 cite. 머지 후 cite 만 제거.

## 활성 (Open / Triaging)

| ID     | Trigger (spawn)                    | Title                                                            | Status | Notes |
| ------ | ---------------------------------- | ---------------------------------------------------------------- | ------ | ----- |
| FU-001 | Wave 4 close (PR #245, 2026-05-09) | dompurify + SafeHtml wrapper — 4 surfaces (XSS hotfix)           | Open   | P1. Notice body / FAQ answer / VOC body / comment HTML render. PR-β `fix/fu-001-dompurify`. 가장 시급. |
| FU-002 | Wave 4 close (PR #245, 2026-05-09) | 마이그 018 — `notices` / `faqs` hot-path 인덱스                  | Open   | P1. `notices(is_visible, visible_from, visible_to)` partial idx + `faqs(category_id, is_visible, sort_order)` idx. PR-γ `fix/fu-002-notice-faq-indexes`. |
| FU-003 | Wave 4 close (PR #245, 2026-05-09) | Notice popup dismiss audit — per-user dismiss row 정합            | Open   | P1. Wave 3 Phase A 머지 후 idle slot. |
| FU-004 | Wave 4 close (PR #245, 2026-05-09) | FAQ search highlight tokenizer — Korean morpheme                 | Open   | P1. Wave 3 Phase A 머지 후 idle slot. |
| FU-005 | Wave 4 close (PR #245, 2026-05-09) | Notice level=urgent 시 Notice popup auto-open 정책 정합           | Open   | P1. Wave 3 Phase A 머지 후 idle slot. |
| FU-006 | Wave 4 close (PR #245, 2026-05-09) | shadcn token rewrite drift — `--border` / `--danger` 잔존        | Open   | P2. Wave 3 close 후 batch. |
| FU-007 | Wave 4 close (PR #245, 2026-05-09) | Notice / FAQ visible_from KST 자정 timestamptz 정합 (8-M2 흡수)   | Open   | P2. Wave 3 close 후 batch. |
| FU-008 | Wave 4 close (PR #245, 2026-05-09) | Sidebar count badge — Notice / FAQ unread count 실연동           | Open   | P2. Wave 3 close 후 batch. |
| FU-009 | Wave 4 close (PR #245, 2026-05-09) | Visual-diff baseline 추가 — Notice popup / FAQ search 결과       | Open   | P2. Wave 3 close 후 batch. |

> Wave 3 (Admin 4 화면) 의 OQ 5 건은 닫힌 wave 가 아니므로 본 bucket 진입 X — `plans/open-questions.md` 에서 추적 (R6 정합).

## 머지 완료 (✅)

| ID         | Trigger (spawn) | Title | Resolution |
| ---------- | --------------- | ----- | ---------- |
| _none yet_ |                 |       |            |

## Backfill 후보

> 본 규칙 채택 이전에 follow-up 으로 처리된 작업들. **재명명 X** (cite drift 방지). 단순 reference 표.

| 원 ID           | Spawn wave            | 처리 PR | 비고                                       |
| --------------- | --------------------- | ------- | ------------------------------------------ |
| F-1 / F-2 / F-3 | Wave 1.6 (C-9 직후)   | PR #175 | 묶음 PR — R5 위반 패턴 (grandfather)       |
| F-bundle minor  | Wave 1.6 (PR #175 후) | PR #178 | minor cleanup — R5 위반 패턴 (grandfather) |
| Issue #155      | Wave 1.6 (C-8 직후)   | PR #161 | VocSortColumn enum align — R4 위반 패턴    |
| Issue #156      | Wave 1.6 (C-8 직후)   | PR #159 | VocRow tag-row 통합 — R4 위반 패턴         |
| Issue #162      | Wave 1.6 (β 중)       | PR #165 | sticky 헤더 갭 — R4 위반 패턴              |
| Issue #166      | Wave 1.6 (#165 후속)  | PR #169 | sticky ↔ AppShell padding 토큰화 — R4 위반 |

> 위 6건은 본 규칙 시점부터는 `FU-NNN` 으로 부여될 패턴. 현재 ID 는 grandfather 로 둔다.
