# 0006 — Dashboard `default_date_range='custom'` 사용자 정의 시작/종료일 저장 정책

## Status

Proposed (2026-05-10 FU-026 분리 — Wave 2 Phase E 마무리 후 신설). **OQ 잠금 전 마이그/zod/UI PR 진입 금지.**

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

`'custom'` 일 때만 양쪽 NOT NULL + `start <= end`. 그 외 enum 값일 때 양쪽 NULL 강제.

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

### 3. 마이그 023 사전 검증

기존 row 중 `default_date_range='custom'` 인 행 존재 시 CHECK 가 즉시 실패. Wave 2 Phase E 가 신규 `'custom'` 저장을 disabled-radio 로 차단 + 기존 row 도 disabled radio fallback 으로만 표시 → **현재 시점 0 행 가정**. 마이그 진입 직전 다음 가드 SQL:

```sql
DO $$
DECLARE
  rogue_count INT;
BEGIN
  SELECT COUNT(*) INTO rogue_count
    FROM dashboard_settings
   WHERE default_date_range = 'custom';
  IF rogue_count > 0 THEN
    RAISE EXCEPTION 'FU-026: % rogue rows with default_date_range=custom — backfill required before CHECK', rogue_count;
  END IF;
END $$;
```

검출 시 운영 백필 결정 (option A: `default_date_range='3m'` 로 coerce, option B: 사용자별 직접 picker 입력 유도) — **백필 정책은 OQ-1 에서 잠근다 (현재는 0 행 가정 + 검출 시 abort).**

### 4. zod 확장 (`shared/contracts/`)

`DashboardSettings` schema 에 두 옵셔널 ISO date 필드 추가 + cross-field refine:

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

**경계:** 상한 (`max range`) 은 본 ADR 미잠금 — UI 가 5년 cap 제시 정도는 가능하나 zod refine 까지는 OQ-2.

### 5. UI 시맨틱 (Dialog)

- `'custom'` radio enable.
- 선택 시 inline `RangePicker` (react-day-picker `mode="range"`) 노출.
- Picker 값 변경 → draft 의 `customStartDate / customEndDate` 동시 update.
- 저장 시 zod refine 통과 후 PUT.
- 다른 enum 으로 변경 시 picker 값 자동 NULL clear (CHECK 정합).
- Phase E 의 disabled-radio + `getRadioValue` silent-loss-prevention 코드는 본 ADR 진입 PR 에서 제거 (살아있는 enable path 가 fallback 책임 흡수).

### 6. API 계약

`PUT /api/dashboard/settings` body 에 두 필드 옵셔널 수용. zod refine 동일. OpenAPI (`shared/openapi.yaml`) 동기 갱신. 응답 페이로드도 두 필드 포함 (반응형 UI 가 즉시 picker 채움).

### 7. Admin 기본값 행 (`user_id IS NULL`)

동일 시맨틱. Admin 이 `'custom'` 으로 *전체 사용자 기본값* 을 설정하면 절대 날짜가 모두에게 적용 — *시간 경과에 따라 stale 됨*. **OQ-3 에서 시맨틱 (절대 vs 상대 offset) 잠금**. 잠금 전 Admin 행에 `'custom'` 저장 차단 (UI disable + BE 415).

## Consequences

- **+** `'custom'` 을 *기본값* 으로 영구화 → 외부 보고/회의 주기 일정한 사용자에게 가치.
- **+** CHECK 제약으로 dead 데이터 방지.
- **−** 절대 날짜는 stale 위험 — OQ-3 미잠금 시 위 §7 차단 운용.
- **−** 마이그 + zod + UI 3-pront 변경 → 단일 큰 PR (또는 마이그 → zod → UI 의 3-PR sequence).

## Open Questions

- **OQ-1 (백필 정책):** 마이그 023 사전 검증에서 rogue row 검출 시 — abort vs `default_date_range='3m'` coerce vs 사용자 통보 후 입력 유도. 현재 abort 만 안전.
- **OQ-2 (range 상한):** 5 년 / 10 년 / 무제한 — 운영 정책 결정.
- **OQ-3 (Admin 기본값 시맨틱):** 절대 날짜 (현재안) vs 상대 offset (`custom_offset_days INTEGER` 별 컬럼) — Admin 행 한정 issue. MVP 절대 날짜 + Admin 행 `'custom'` 차단 후 NextGen 에서 상대 offset 추가가 가장 reversible.
- **OQ-4 (timezone):** `DATE` 타입 사용 → 서버 timezone 무관 (calendar day). 화면은 클라이언트 로컬 day 로 해석. 운영자 timezone 차이 발생 시 (KST 사용자 vs UTC 서버 cron 리포트 등) 일관성 정책 — 별 ADR 후보.

## Cross-References

- `docs/specs/requires/dashboard.md §4, §13.5` — enum + 스키마 정본.
- `docs/specs/requires/requirements.md §4` — 날짜 필터 enum 정합.
- `docs/specs/plans/followup-bucket.md FU-026` — 본 ADR 트리거.
- `frontend/src/features/dashboard/ui/DashboardSettingsForm.tsx` — Phase E disabled-radio.
- `frontend/src/features/dashboard/model/useDashboardDraft.ts` — Phase E silent-loss-prevention `getRadioValue`.
- `backend/migrations/022_dashboard_admin_default_unique.sql` — 직전 마이그 (다음 = 023).
