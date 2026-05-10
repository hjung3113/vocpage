# 0006 — Dashboard `default_date_range='custom'` 사용자 정의 시작/종료일 저장 정책

## Status

Accepted (2026-05-10). 잠금 후 마이그 023 / zod / UI 3-PR sequence 진입 가능. timezone 해석 시맨틱은 별 ADR 0007.

## Context

`dashboard.md §4` 날짜 필터 enum 은 `'1m' | '3m' | '1y' | 'all' | 'custom'` (정본: migration 011). 화면 상단 우측 날짜 필터는 `'custom'` 선택 시 시작/종료일 입력을 받는다 (세션 임시값 — `dashboard.md §13` "세션 임시 설정 (sessionStorage)"). 한편 `DashboardSettingsDialog` (Wave 2 Phase E, PR #308 머지) 의 **기본 날짜 범위 (default)** 는 사용자 / Admin 기본값 행에 영구 저장된다 (`dashboard_settings.default_date_range`).

**갭:** `dashboard_settings` 스키마는 `default_date_range` enum 값만 저장하고 `'custom'` 의 시작/종료일 컬럼이 없다. 이 상태에서 `default_date_range='custom'` 로 저장하면 *기본값* 으로서의 의미가 미정 (시작/종료일 부재 → 화면 진입 시 어떤 날짜를 보여줄지 결정 불가).

Phase E 의 base 처리는 보수적 — `DashboardSettingsForm.tsx` 에서 `'custom'` radio 를 disabled 표시하여 *신규 저장 차단* + 기존 row 가 이미 `'custom'` 인 경우 `useDashboardDraft` 가 `silent loss` 만 방지 (`getRadioValue` fallback). 즉 *읽기 호환* 만 확보, *쓰기 진입* 은 본 ADR 잠금 후로 이연.

본 ADR 은 사용자 정의 날짜 범위를 **기본값으로 영구 저장**하기 위한 스키마 / CHECK / zod / UI 시맨틱을 잠근다. 마이그 / zod / picker 구현은 본 ADR Accepted 이후 별 PR.

### 정본 단편

- `dashboard.md §4` 날짜 필터 enum + 기본 `1m`.
- `dashboard.md §13.5` `dashboard_settings` 스키마 (정본: migration 011).
- `dashboard.md §13` "세션 임시 설정 (sessionStorage)" — `'custom'` 의 *세션 선택* 은 별도 (본 ADR 범위 외).
- `requirements.md §4` 날짜 필터 enum 정합.
- 마이그 022 (Wave 2 Phase D-E) — 다음 신설 번호 = **023**.
- `react-day-picker` — `frontend/package.json` 기존 의존성 (DayPicker 컴포넌트 이미 일부 사용 중. 본 ADR 진입 시 RangePicker variant 추가).
- Phase E 의 disabled-radio + `getRadioValue` silent-loss-prevention (`DashboardSettingsForm.tsx`, `useDashboardDraft.ts`).

### 운영 환경 가정

본 ADR 은 **단일 timezone 운영자 환경** 을 가정한다. 다중 timezone (KST 사용자 ↔ UTC cron 리포트 등) 의 해석 시맨틱은 ADR 0007 에서 잠근다.

## Decision

### 1. 스키마 (마이그 023)

`dashboard_settings` 두 컬럼 신설:

```sql
ALTER TABLE dashboard_settings
  ADD COLUMN custom_start_date DATE NULL,
  ADD COLUMN custom_end_date   DATE NULL;
```

`DATE` 타입 (시각 정보 불필요; 날짜 필터는 day 단위). `NULL` 허용 — 비-`'custom'` enum 시 NULL.

### 2. CHECK 제약

`'custom'` 일 때만 양쪽 NOT NULL + `start <= end`. 그 외 enum 값일 때 양쪽 NULL 강제. **상한 (max range) 은 DB CHECK 에 박지 않는다** (§5 근거 참조).

```sql
ALTER TABLE dashboard_settings
  ADD CONSTRAINT dashboard_settings_custom_dates_check
  CHECK (
    (default_date_range = 'custom'
       AND custom_start_date IS NOT NULL
       AND custom_end_date   IS NOT NULL
       AND custom_start_date <= custom_end_date)
    OR
    (default_date_range <> 'custom'
       AND custom_start_date IS NULL
       AND custom_end_date   IS NULL)
  );
```

**근거:** "비-custom 일 때 NULL 강제" 는 dead 데이터 방지 + 사용자가 `'1m'` 로 변경 시 picker 값 자동 정리. 양쪽 모두 검증 가능 (write 시점 application 단에서 zod 가 동일 규칙 enforce → DB CHECK 는 마지막 방어선).

### 3. 마이그 023 사전 검증 + 운영 백필 절차 (OQ-1 잠금)

기존 row 중 `default_date_range='custom'` 인 행 존재 시 CHECK 가 즉시 실패. Wave 2 Phase E 가 신규 `'custom'` 저장을 disabled-radio 로 차단 + 기존 row 도 disabled radio fallback 으로만 표시 → **현재 시점 0 행 가정**. 마이그 진입 직전 다음 가드 SQL (마이그 023 본문 안):

```sql
DO $$
DECLARE
  rogue_count INT;
BEGIN
  SELECT COUNT(*) INTO rogue_count
    FROM dashboard_settings
   WHERE default_date_range = 'custom';
  IF rogue_count > 0 THEN
    RAISE EXCEPTION 'FU-026: % rogue rows with default_date_range=custom — manual backfill required before CHECK', rogue_count;
  END IF;
END $$;
```

**검출 시 운영 절차** (자동 일괄 coerce 금지 — 시그널 파괴):

1. 진단 SQL 로 rogue row 식별:
   ```sql
   SELECT id, user_id, default_date_range, created_at, updated_at
     FROM dashboard_settings
    WHERE default_date_range = 'custom';
   ```
2. 행 단위 의도 확인 후 **둘 중 하나** 선택:
   - **(A) 시스템 기본값 복귀**: `UPDATE dashboard_settings SET default_date_range='1m' WHERE id=…` (정본 `dashboard.md §4` 시스템 기본 = `'1m'`).
   - **(B) row 삭제**: `DELETE FROM dashboard_settings WHERE id=…` — 사용자가 다음 진입 시 default 자동 생성.
3. rogue_count = 0 확인 후 마이그 023 재실행.

`'3m'` 등 임의 enum 으로 자동 coerce 는 사용자 동의 없는 가시 변경 + 자의적 → 거부.

### 4. zod 확장 (`shared/contracts/`)

`DashboardSettings` schema 에 두 옵셔널 ISO date 필드 추가 + cross-field refine (start ≤ end 만 검증; 상한 없음 — OQ-2 잠금):

```ts
const dashboardSettingsSchema = baseSchema.extend({
  customStartDate: z.string().date().nullable().optional(),
  customEndDate:   z.string().date().nullable().optional(),
}).refine(
  (s) => {
    if (s.defaultDateRange === 'custom') {
      return !!s.customStartDate && !!s.customEndDate
          && s.customStartDate <= s.customEndDate;
    }
    return s.customStartDate == null && s.customEndDate == null;
  },
  { path: ['defaultDateRange'], message: 'custom requires start<=end; non-custom requires both null' }
);
```

### 5. UI 시맨틱 (Dialog) + range 상한 정책 (OQ-2 잠금)

- `'custom'` radio enable.
- 선택 시 inline `RangePicker` (react-day-picker `mode="range"`) 노출.
- Picker 값 변경 → draft 의 `customStartDate / customEndDate` 동시 update.
- 저장 시 zod refine 통과 후 PUT.
- 다른 enum 으로 변경 시 picker 값 자동 NULL clear (CHECK 정합).
- Phase E 의 disabled-radio + `getRadioValue` silent-loss-prevention 코드는 본 ADR 진입 PR 에서 제거 (살아있는 enable path 가 fallback 책임 흡수).
- **range 상한**: DB CHECK / zod refine 어디에도 박지 않는다. UI `RangePicker` 만 5년 초과 날짜 `disabled` 로 **soft cap** 표시 (편의). 기술적 우회 시 통과.
  - 근거: enum `'all'` 이 무한 범위인데 `'custom'` 만 5년 hard cap 은 UX 모순. 한 번 박은 hard cap 은 완화는 쉬워도 historical violating row 발생 시 곤란. picker soft cap 으로 의도적 큰 range 만 통과.

### 6. API 계약 + invariant 위반 응답 정책 (OQ-5 잠금)

- `PUT /api/dashboard/settings` body 에 두 필드 옵셔널 수용. zod refine 동일.
- OpenAPI (`shared/openapi.yaml`) 동기 갱신.
- 응답 페이로드도 두 필드 포함 (반응형 UI 가 즉시 picker 채움).
- **CHECK 우회 invariant 위반 케이스** (`default_date_range='custom'` AND dates IS NULL — 이론상 CHECK 가 막지만 manual SQL / pre-CHECK 잔여 row 등 방어선): BE 가 응답 직전 정합 검증, 위반 시 **HTTP 500 + 구조화 로그** (`{event:'dashboard_settings_invariant_violation', settings_id, default_date_range}`). fallback enum 강등 거부 — 시그널 파괴.

### 7. Admin 기본값 행 (`user_id IS NULL`) — 'custom' 차단 (OQ-3 잠금)

Admin 행에 `'custom'` 저장 **차단 유지**:

- BE: `user_id IS NULL` AND `default_date_range='custom'` PUT 시 **HTTP 415 + 구조화 에러** (`{code:'ADMIN_CUSTOM_NOT_SUPPORTED'}`).
- UI: Dialog 의 Admin 모드 (Wave 2 Phase E `admin-default scope toggle`) 진입 시 `'custom'` radio disable + tooltip:
  > "Admin 기본값은 절대 날짜라 시간 경과 시 stale 됩니다. 사용자별 'custom' 은 가능, Admin 전체 기본은 NextGen 의 상대 offset (ADR 후속) 에서 지원 예정."
- **근거**: 절대 날짜를 Admin 행에 허용하면 신규 사용자에게 *과거 절대 범위* 가 silent 노출. 가역성 — 지금 차단 후 NextGen 에서 `custom_offset_days` 컬럼 추가 = append-only. 절대 허용 후 회수는 기존 Admin row 마이그 필요.
- "사용자는 되는데 Admin 만 막힘" UX 불일치는 tooltip 으로 명시 해소 — silent 차단 금지.

### 8. Timezone 해석 시맨틱 (OQ-4 → ADR 0007 분기)

본 ADR 은 **DATE 타입 + zod ISO date 직렬화까지만 잠금**. 해석 timezone (client-local vs 계정 vs 조직) 은 **ADR 0007 (별)** 에서 잠근다. 본 ADR Accepted 시점 운영 가정은 "Context — 운영 환경 가정" 절 참조 (단일 timezone).

## Consequences

- **+** `'custom'` 을 *기본값* 으로 영구화 → 외부 보고/회의 주기 일정한 사용자에게 가치.
- **+** CHECK 제약으로 dead 데이터 방지.
- **+** range 상한을 DB 에 박지 않아 `'all'` 시맨틱과 정합 + 향후 정책 변경 가역적.
- **−** Admin 'custom' 차단으로 사용자/Admin UX 분기 — tooltip 으로 운영 정책 명시 필요.
- **−** timezone 잠금이 ADR 0007 까지 이연 — 단일 timezone 운영자 환경 가정 유지 필요.
- **−** 마이그 + zod + UI 3-pront 변경 → **3-PR sequence 권장** (단일 PR 거부 — 마이그 적용 후 zod/UI 실패 시 롤백 곤란, CLAUDE.md 가역성 게이트).

## Open Questions (Resolved)

- **OQ-1 (백필 정책)** — Resolved: abort 유지 + Decision §3 운영자 수동 절차 (옵션 A `'1m'` 복귀 / 옵션 B row 삭제). 자동 일괄 coerce 거부.
- **OQ-2 (range 상한)** — Resolved: DB CHECK / zod refine 미적용. UI picker soft 5년 cap 만. `'all'` 정합 우선.
- **OQ-3 (Admin 기본값 시맨틱)** — Resolved: Admin 행 `'custom'` 차단 유지 (BE 415 + UI tooltip). 상대 offset 은 NextGen 별 ADR.
- **OQ-4 (timezone)** — Resolved: 별 ADR 0007 로 분기. 본 ADR 은 DATE + ISO date 직렬화까지.
- **OQ-5 (invariant 위반 응답 — 적대적 리뷰 추가)** — Resolved: BE 500 + 구조화 로그. fallback 강등 거부.

## Cross-References

- `docs/specs/requires/dashboard.md §4, §13.5` — enum + 스키마 정본.
- `docs/specs/requires/requirements.md §4` — 날짜 필터 enum 정합.
- `docs/specs/plans/followup-bucket.md FU-026` — 본 ADR 트리거.
- `docs/adr/0007-*` — timezone 해석 시맨틱 (후속).
- `frontend/src/features/dashboard/ui/DashboardSettingsForm.tsx` — Phase E disabled-radio.
- `frontend/src/features/dashboard/model/useDashboardDraft.ts` — Phase E silent-loss-prevention `getRadioValue`.
- `backend/migrations/022_dashboard_admin_default_unique.sql` — 직전 마이그 (다음 = 023).
