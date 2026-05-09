# 0005 — Trash 복원 정책 (보존 / 복원자 / cascade / audit)

## Status

Accepted (2026-05-09 사용자 grill 결정 — OQ-3 / OQ-4 close).

## Context

Wave 3 Phase C 의 Trash 화면은 §8.9 Soft Delete 로 `deleted_at IS NOT NULL` 인 VOC 를 UI 로 조회·복원·영구삭제 진입점을 제공한다. 정본은 `feature-voc.md §9.4.7` + `requirements.md §15.4`.

기존 spec 의 단편:
- **§D7 (요구사항 §17)**: "데이터 보존 = 무기한" — VOC soft delete 및 voc_history 모두.
- **§9.4.7 영구삭제**: "MVP 는 영구삭제 비활성화 (disabled + tooltip "MVP는 영구삭제 미지원"). NextGen 활성화 자리만 확보."
- **§9.4.7 복원**: "`PATCH /api/vocs/:id/restore` → `vocs.deleted_at=NULL` + `voc_history` `restore` 이벤트 + `tag_rules` 멱등 재실행."
- **§D13 (`vocs.parent_id` ON DELETE SET NULL)**: 부모 hard delete 시 sub-task 보존 (D7 무기한 보존과 일관).
- **§15.4 운영 갭 해소**: `vocs.deleted_by` / `voc_restore_log` 컬럼/테이블 추가 (마이그 015, OQ-4 grill 결정 2026-05-09 — 014=Tag Master / 015=Trash / 017=user_role_log).
- **§9.4.7 회귀 테스트 3 건**: (1) Manager `/trash` 호출 시 403, (2) 복원 후 일반 목록 노출, (3) 복원 시 `tag_rules` 재실행으로 `voc_tags.source='rule'` 재부착.

기존 단편 통합 결과: 보존 기간은 **MVP 무기한** (D7 정합) — `§15.4` "30일 보존 후 자동 영구 삭제" 표현은 본 ADR Accepted 시점에 폐기, NextGen 자동 영구삭제 cron 은 별 ADR 로 재논의. cascade 룰·audit 컬럼·Manager 진입 권한(404 vs 403) 도 본 ADR §"Decision" 에서 잠금.

본 ADR 은 위 단편을 통합하여 Trash 화면 복원 정책을 정본으로 잠근다.

## Decision

**제안 (사용자 최종 결정 시점에 잠근다):**

### 1. 보존 기간

**무기한** (D7 정합). `§15.4` 의 "30일 보존 후 자동 영구 삭제" 표현은 NextGen 활성화 시 운영 옵션으로 재논의. MVP 는 자동 영구삭제 cron 없음. → **`§15.4` 표현 동기화 PR 선행 필요** (OQ-4 동봉).

### 2. 복원 권한

**Admin only.** Manager 는 `/admin/trash` 라우트 진입 자체 차단 (404, ADR 0004 §"404 vs 403" 정합 — 존재 은닉). 사이드바 admin 그룹에서도 Manager 는 "휴지통" 항목 미노출.

### 3. 영구삭제

**MVP 비활성화** (§9.4.7 그대로). 버튼은 disabled + tooltip. 자리만 확보. NextGen 활성화 시:
- 권한: Admin only (영구삭제는 reversibility gate 상 가장 위험한 액션)
- 절차: 2-step 확인 (확인 다이얼로그 + "이 VOC 의 issue_code 입력" 매치)
- audit: `voc_restore_log` 에 `action='hard_delete'` 행 추가 (PIPA 7 년 보존)

### 4. Cascade 룰

| 케이스 | 정책 |
| --- | --- |
| Soft-deleted VOC 의 sub-task 도 함께 soft-deleted | 부모 복원 시 sub-task **자동 복원 안 함**. Sub-task 는 개별 행으로 휴지통 노출 + 개별 복원. (이유: sub-task 일부만 복원하고 싶은 운영 케이스 존재 + cascade 자동 복원은 트랜잭션 비용) |
| 부모 hard delete (D13 ON DELETE SET NULL) 후 sub-task 복원 | sub-task 의 `parent_id=NULL` 그대로 root VOC 로 복원 (§9.4.7 명시) |
| 병합으로 사라진 태그가 부착되어 있던 VOC 복원 | 복원 시 `tag_rules` 멱등 재실행 → 새 태그 자동 부착. 이전 태그 부착 row 는 재현 불가 (병합 = irreversible). 운영 가이드에 명시. |
| Soft-deleted VOC 의 첨부파일 | §8.9 정책 그대로 (`?includeDeleted=true` 로 Admin 다운로드 가능). 복원 시 첨부 row 그대로 보존. |

### 5. Audit

`voc_restore_log` 테이블 (마이그 015) 컬럼:

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid | PK |
| `voc_id` | uuid FK → vocs.id | RESTRICT (vocs hard delete 시 audit 보호) |
| `action` | text CHECK (`restore` / `hard_delete`) | NextGen 영구삭제 시 hard_delete 사용 |
| `actor_id` | uuid FK → users.id | 복원자 / 영구삭제자 |
| `before_deleted_at` | timestamptz | 복원 전 deleted_at 값 |
| `before_deleted_by` | uuid FK → users.id | 원 삭제자 (vocs.deleted_by 와 join) |
| `created_at` | timestamptz default now() | |

`vocs.deleted_by` 컬럼 추가 (마이그 015) — `vocs.deleted_at` 세팅 시 함께 기록. 기존 §15.1.1 PIPA 7 년 보존 룰 정합.

### 6. 회귀 테스트 (`feature-voc.md §9.4.7` 3 건 + 본 ADR 추가 4 건 = 7 건)

- 기존 3 건 유지.
- 추가 (4): (a) Manager 가 `/admin/trash` 진입 시 404 (sidebar 미노출 + route 차단), (b) Sub-task 만 soft-deleted 인 케이스 휴지통 노출, (c) 부모 hard delete 후 sub-task 복원 시 `parent_id=NULL` 그대로, (d) 복원 시 `voc_restore_log` row 1 건 추가 + `vocs.deleted_at=NULL` + `vocs.deleted_by=NULL`.

## Considered Options

**Option A (채택 제안)**: 무기한 보존 + Admin only 복원 + 영구삭제 disabled + sub-task 개별 복원 + `voc_restore_log` 별 테이블.

- 장점: D7 / §9.4.7 / §15.4 정합 + reversibility gate 정합 (irreversible 액션은 권한 좁힘 + 자동화 제거).
- 단점: §15.4 의 "30일 보존" 표현 동기화 PR 필요.

**Option B**: 30 일 보존 + 자동 cron 영구삭제.

- 장점: §15.4 표현 그대로.
- 단점: D7 무기한 정책 위반. cron job spec 미작성 (§15.1.1 retention 만료 마스킹 cron 만 명시). MVP 범위 초과.

**Option C**: cascade 자동 복원 (부모 복원 시 sub-task 도 함께).

- 장점: 운영자 클릭 1 회로 끝.
- 단점: 일부만 복원하고 싶은 운영 케이스 차단. cascade 트랜잭션 비용 + tag_rules 재실행 N 회. 사용자 의도 추정 위험.

## Consequences

- **마이그 015 spec 잠금**: `vocs.deleted_by uuid FK → users.id NULL` + `voc_restore_log` 테이블 신설. rollback SQL 동봉.
- **§15.4 동기화 PR**: "30일 보존 후 자동 영구 삭제" → "MVP 무기한 보존, NextGen 자동 cron 재논의" 표현 변경. Wave 3 Phase A 와 함께.
- **Sidebar admin 그룹 매트릭스**: Manager 는 "휴지통" 미노출 (ADR 0004 와 일관). 4 화면 중 Trash 만 Manager 미노출.
- **Audit 단일 정본**: `voc_restore_log` 가 복원/영구삭제 단일 audit. `voc_history` 의 `restore` 이벤트 row 는 그대로 유지 (사람 친화 view), `voc_restore_log` 는 머신 친화 (`actor_id` 인덱스 / `action` 인덱스).
- **회귀 테스트 7 건**: Wave 3 Phase C BE Jest 통합 테스트 의무.
- **NextGen 영구삭제 활성화 경로**: 본 ADR §3 의 절차를 그대로 활성화 → ADR 갱신 + spec sync. 컬럼 / 테이블은 본 Wave 에서 자리 확보 완료.

## Follow-ups

- [x] OQ-3 사용자 결정 (Option A — `user_role_log` 별 테이블) → 마이그 017 (PR-α docs/wave-3-oq-sync)
- [x] OQ-4 사용자 결정 → 마이그 번호 014 Tag Master / 015 Trash / 017 user_role_log (013/016 점유) → `next-session-tasks.md §권한·스키마 인프라 PR 후보` 동기화 (PR-α)
- [x] `requirements.md §15.4` "30일 보존" 표현 → "MVP 무기한, NextGen 재논의" (PR-α)
- [ ] `feature-voc.md §9.4.7` 회귀 테스트 3 건 → 7 건 (sub-task / cascade / audit) 보강 — Wave 3 Phase C 에 동봉
- [ ] NextGen 영구삭제 활성화 시 별 ADR 또는 본 ADR Status `Accepted → Superseded by 000X`
