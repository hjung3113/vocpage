# Follow-up Bucket

> 닫힌 wave에서 발견된 후속 작업의 단일 누적 위치. ID 규칙: `FU-NNN` flat global, append-only (R6).
> 정본: 본 파일. ID 규칙은 root `CLAUDE.md §Documents`.

## 운영 룰

- **신규 follow-up 발견 시** → 다음 정수 `FU-NNN` 부여 + 아래 표에 row 추가. 절대 기존 wave 의 C-N 시퀀스에 끼우지 않는다.
- **여러 wave 에 걸친 follow-up** → 한 행, `Trigger` column 에 spawn wave + cite line 명시.
- **PR 머지 시** → `Status` ✅, `Resolution` column 에 PR# / 한 줄 결과 기록. 본 행은 그대로 유지 (archive 로 옮기지 않음 — 누적 인덱스로 본 파일 자체가 영구).
- **후속이 다른 follow-up 을 낳으면** → 새 `FU-NNN` 추가, `Trigger` 에 원 FU 명시 (`FU-003 from FU-001`).
- **bucket 으로 들어오는 조건** = 닫힌 wave 와 관련된 추가 작업. 활성 wave 내부 발견 sub-task 는 그 wave 의 다음 정수 task ID (R2) 로 흡수, bucket 진입 X.
- **추적 단순화** — `Open` 상태 row 는 활성 plan (`next-session-tasks.md`) 에서도 한 줄 cite. 머지 후 cite 만 제거.

## 활성 (Open / Triaging)

| ID     | Trigger (spawn)                                      | Title                                                                                                             | Status | Notes                                                                                                                                                                                                                                                          |
| ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FU-001 | Wave 4 close (PR #245, 2026-05-09)                   | dompurify + SafeHtml wrapper — 4 surfaces (XSS hotfix)                                                            | ✅     | PR #248 `67b1eda` (2026-05-09) + harden `4fe9e25`. Notice body / FAQ answer / VOC body / Notice popup 4 surface 에 `SafeHtml` 적용 (`shared/ui/safe-html/`).                                                                                                  |
| FU-002 | Wave 4 close (PR #245, 2026-05-09)                   | 마이그 018 — `notices` / `faqs` hot-path 인덱스                                                                   | ✅     | PR #249 `264b908` (2026-05-09). `notices(is_visible, visible_from, visible_to)` partial idx + `faqs(category_id, is_visible, sort_order)` idx.                                                                                                                |
| FU-003 | Wave 4 close (PR #245, 2026-05-09)                   | Notice popup dismiss audit — per-user dismiss row 정합                                                            | ✅     | Audit closed (2026-05-09). 현 구현 spec §10.3.2 와 정합 — localStorage `notice_dismiss_until_<userId>` (BE stateless 명시). DB row 화 미요구. `useNoticePopupTrigger` + `NoticePopupModal` 회귀 테스트 그린. 코드 변경 없음.                                  |
| FU-004 | Wave 4 close (PR #245, 2026-05-09)                   | FAQ search highlight tokenizer — Korean morpheme                                                                  | ✅     | Audit closed (2026-05-09) — wontfix. 현 `highlightText` 가 case-insensitive substring 매치로 한글 부분 매치 처리; spec §10.4 가 형태소 분석 요구하지 않음. 형태소 tokenizer 는 overspec → 도입 시 별 FU.                                                      |
| FU-005 | Wave 4 close (PR #245, 2026-05-09)                   | Notice level=urgent 시 Notice popup auto-open 정책 정합                                                           | ✅     | Audit closed (2026-05-09) — wontfix. spec §10.3.2 는 `is_popup=ON` 만 popup 트리거 명시; urgent 별도 auto-open 정책 미정의. 사이드바 `!` 배지 (§10.2) 로 분리 처리. 정책 신설 필요 시 별 spec 보강 + 별 FU.                                                   |
| FU-006 | Wave 4 close (PR #245, 2026-05-09)                   | shadcn token rewrite drift — `--border` / `--danger` 잔존                                                         | Open   | P2. Wave 3 close 후 batch.                                                                                                                                                                                                                                     |
| FU-007 | Wave 4 close (PR #245, 2026-05-09)                   | Notice / FAQ visible_from KST 자정 timestamptz 정합 (8-M2 흡수)                                                   | Open   | P2. Wave 3 close 후 batch.                                                                                                                                                                                                                                     |
| FU-008 | Wave 4 close (PR #245, 2026-05-09)                   | Sidebar count badge — Notice / FAQ unread count 실연동                                                            | Open   | P2. Wave 3 close 후 batch.                                                                                                                                                                                                                                     |
| FU-009 | Wave 4 close (PR #245, 2026-05-09)                   | Visual-diff baseline 추가 — Notice popup / FAQ search 결과                                                        | Open   | P2. Wave 3 close 후 batch.                                                                                                                                                                                                                                     |
| FU-010 | Wave 3 Phase A (PR #250 codex deferral, 2026-05-09)  | `user_role_log` CHECK constraint — `old/new role/active` 값 invariant                                             | Open   | P2. codex 가 deferral 한 defense-in-depth — BE validator 가 1차 게이트, CHECK 는 보강. 별 마이그로 분리 권장 (contract 변경 검토 단위 분리).                                                                                                                   |
| FU-011 | Wave 3 Phase A (4 PR CI noise, 2026-05-09)           | `lint-root` pre-existing 실패 3건 — `@typescript-eslint/no-var-requires` (faqs/notices/faq-categories `.test.ts`) | ✅     | PR #260 `13395c7` (2026-05-09). `require()` → `import * as` + 타입 캐스팅.                                                                                                                                                                                     |
| FU-012 | Wave 3 Phase A (Resolution α, PR #251, 2026-05-09)   | Tag merge audit 도입 시 `tag_merge_log` 테이블 spec                                                               | Open   | P3. Resolution α 으로 `tags.merged_into_id` 보류됨 → audit 요구가 발생할 때만 진입. 병합은 source-row hard-delete (`feature-voc.md §9.4.6` · ADR 0004) 유지.                                                                                                   |
| FU-013 | Wave 3 Phase C (PR #263 codex P1, 2026-05-09)        | `vocs.parent_id` ON DELETE SET NULL 마이그 — D13 정합 (003 미적용)                                                | ✅     | PR #266 (마이그 019, 2026-05-09). pg-mem 회귀 3건 (up SET NULL / down NO ACTION / orphan 보존).                                                                                                                                                                |
| FU-014 | Wave 3 Phase B (PR #262 codex P1, 2026-05-09)        | `tags(name, kind)` UNIQUE 제약 — 현재 `slug` UNIQUE 우연 의존                                                     | ✅     | PR #267 (마이그 020, 2026-05-09). 동일 name 다른 kind 허용 / 동일 (name, kind) 거부. pg-mem 회귀 3건.                                                                                                                                                          |
| FU-018 | Wave 3 Phase F close (W3-8, 2026-05-09)              | 권한 매트릭스 BE 통합 테스트 단일 파일 — §13.2 + §8.3 행 전체 한 곳에서                                            | Open   | P2. 현재 per-route 분산 커버 (admin-{tags,trash,users,masters}.test.ts + assertCanManageVoc + vocs.test.ts reassign 매트릭스) 100% 그린. §8.3 / §13.2 행렬을 한 파일로 합치는 명시적 통합 테스트 별 PR (FU-015 와 별개 — 본 항목은 분산 커버 가독성 보강).    |
| FU-019 | Wave 3 Phase D (PR #269, 2026-05-09)                 | equipment / db 마스터 real MSSQL loader — 현재 stub                                                               | Open   | P3 (외부 의존). external-masters.md §7 swap strategy 따라 loader 함수 1개 교체. MSSQL 스키마 확정 시 unblock.                                                                                                                                                  |
| FU-020 | Wave 3 Phase D (PR #269, 2026-05-09)                 | Multi-instance refresh race condition — DB advisory lock                                                          | Open   | P3 (NextGen). 단일 인스턴스 운영 전제 시 보류. 다중 인스턴스 진입 시 `pg_advisory_lock` 으로 refresh 직렬화.                                                                                                                                                   |
| FU-015 | Wave 3 Phase B+C (PR #262/#263 codex P2, 2026-05-09) | Admin BE 테스트 service mock 의존 — DB-backed 통합 테스트 추가                                                    | Open   | P2. admin-trash.test.ts / admin-tags.test.ts 가 repository mock 이라 SQL drift 미검출 (PR #263 hotfix 에서 trash.sql.test.ts 회귀 도입). 본격 통합 별 PR.                                                                                                      |
| FU-016 | Wave 3 Phase B (PR #262 codex P2, 2026-05-09)        | Tag rule 일시중지 UI — 규칙 선택 진입점                                                                           | Open   | P2. PR #262 hotfix 에서 일시중지 버튼 disabled placeholder. tag_rules 별 entity 의 management UI 별 PR.                                                                                                                                                        |
| FU-017 | Page header drift audit (5 pages, 2026-05-09)        | Page Header / Action size system 시행 — `<PageLayout>` + `<PageHeader>` + `--ui-h-*` 토큰 + 5 page 마이그         | ✅     | PR #265 `00bfb33` (2026-05-09). `uidesign.md §5` Slot contract + `--ui-h-*` 토큰 + `<PageLayout>`/`<PageHeader>` + VOC/Notice/FAQ/Tag Master/Trash 마이그. `benchmark/` 폐기. 542/542 FE 테스트 그린.                                                          |

> Wave 3 (Admin 4 화면) 의 OQ 5 건은 닫힌 wave 가 아니므로 본 bucket 진입 X — `wave-3-admin.md §7` 에서 추적.

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
