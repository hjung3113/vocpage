-- globaltabs_order: Admin 기본값 행에만 유효 — GlobalTabs 탭 순서·표시여부
-- [{ systemId: string, visible: boolean }]
ALTER TABLE dashboard_settings
  ADD COLUMN IF NOT EXISTS globaltabs_order jsonb;
