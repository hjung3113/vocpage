-- Up Migration
-- ADR 0006: dashboard `default_date_range='custom'` 의 시작/종료일 영구 저장.
-- See docs/adr/0006-custom-date-range-default.md (Accepted 2026-05-10).

-- §3 사전 검증: 기존 'custom' rogue row 검출 시 abort. 운영 수동 절차 (옵션 A '1m'
-- 복귀 / 옵션 B row 삭제) 후 재실행. 자동 일괄 coerce 금지.
DO $$
DECLARE
  rogue_count INT;
BEGIN
  SELECT COUNT(*) INTO rogue_count
    FROM dashboard_settings
   WHERE default_date_range = 'custom';
  IF rogue_count > 0 THEN
    RAISE EXCEPTION 'FU-026: % rogue rows with default_date_range=custom — manual backfill required before CHECK (see ADR 0006 §3)', rogue_count;
  END IF;
END $$;

-- §1 컬럼 신설.
ALTER TABLE dashboard_settings
  ADD COLUMN custom_start_date DATE NULL,
  ADD COLUMN custom_end_date   DATE NULL;

-- §2 CHECK: 'custom' 일 때만 양쪽 NOT NULL + start <= end. 비-'custom' 시 양쪽 NULL.
-- 상한 (max range) 은 zod / DB 어디에도 없음 (UI picker soft cap 만; ADR 0006 §5).
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

-- Down Migration
ALTER TABLE dashboard_settings
  DROP CONSTRAINT IF EXISTS dashboard_settings_custom_dates_check;
ALTER TABLE dashboard_settings
  DROP COLUMN IF EXISTS custom_end_date,
  DROP COLUMN IF EXISTS custom_start_date;
