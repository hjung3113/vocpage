-- 011: Phase 7 진입 전 요구문서 ↔ 스키마 정합성 보강
-- (schema-requirements-gap.md 2026-04-26 리뷰 결과 반영)

-- ─────────────────────────────────────────────────────────────
-- GAP-3: vocs.status_changed_at — 대시보드 주간 트렌드/완료 KPI 기준
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vocs ADD COLUMN status_changed_at timestamptz;

UPDATE vocs SET status_changed_at = created_at WHERE status_changed_at IS NULL;

ALTER TABLE vocs ALTER COLUMN status_changed_at SET NOT NULL;
ALTER TABLE vocs ALTER COLUMN status_changed_at SET DEFAULT now();

CREATE OR REPLACE FUNCTION set_voc_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status_changed_at := COALESCE(NEW.status_changed_at, now());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_voc_status_changed_at_ins
  BEFORE INSERT ON vocs
  FOR EACH ROW
  EXECUTE FUNCTION set_voc_status_changed_at();

CREATE TRIGGER trg_voc_status_changed_at_upd
  BEFORE UPDATE OF status ON vocs
  FOR EACH ROW
  EXECUTE FUNCTION set_voc_status_changed_at();

CREATE INDEX ON vocs (status_changed_at)
  WHERE status IN ('완료','드랍') AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- GAP-4: dashboard_settings.default_date_range 프리셋 (1m/3m/1y/all/custom)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE dashboard_settings
  DROP CONSTRAINT dashboard_settings_default_date_range_check;

UPDATE dashboard_settings
SET default_date_range = CASE default_date_range
  WHEN '7d'  THEN '1m'
  WHEN '30d' THEN '1m'
  WHEN '90d' THEN '3m'
  ELSE default_date_range
END
WHERE default_date_range IN ('7d','30d','90d');

ALTER TABLE dashboard_settings
  ALTER COLUMN default_date_range SET DEFAULT '1m';

ALTER TABLE dashboard_settings
  ADD CONSTRAINT dashboard_settings_default_date_range_check
  CHECK (default_date_range IN ('1m','3m','1y','all','custom'));

-- ─────────────────────────────────────────────────────────────
-- GAP-1: vocs.issue_code NOT NULL (트리거가 항상 채우지만 invariant 명시)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vocs ALTER COLUMN issue_code SET NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- GAP-7: vocs.review_status partial index (Result Review 큐)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX ON vocs (review_status)
  WHERE review_status IS NOT NULL AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- GAP-8: vocs.due_date partial index (SLA·에이징)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX ON vocs (due_date)
  WHERE deleted_at IS NULL AND status NOT IN ('완료','드랍');

-- ─────────────────────────────────────────────────────────────
-- GAP-9: 입력 길이 제약 DB CHECK (feature-voc.md §8.10)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vocs
  ADD CONSTRAINT vocs_title_length_check
  CHECK (char_length(title) <= 200);

ALTER TABLE vocs
  ADD CONSTRAINT vocs_body_length_check
  CHECK (octet_length(body) <= 65536);

ALTER TABLE comments
  ADD CONSTRAINT comments_body_length_check
  CHECK (octet_length(body) <= 16384);

ALTER TABLE voc_internal_notes
  ADD CONSTRAINT voc_internal_notes_body_length_check
  CHECK (octet_length(body) <= 16384);

-- ─────────────────────────────────────────────────────────────
-- GAP-10: voc_types.color hex 형식 CHECK + default 정정
-- ─────────────────────────────────────────────────────────────
-- 기존 named color 매핑 (design.md status token 기준)
UPDATE voc_types SET color = CASE color
  WHEN 'red'    THEN '#e5534b'
  WHEN 'blue'   THEN '#5a8def'
  WHEN 'green'  THEN '#3fb950'
  WHEN 'yellow' THEN '#d29922'
  WHEN 'gray'   THEN '#8a8f98'
  ELSE color
END
WHERE color !~ '^#[0-9a-fA-F]{6}$';

-- 매핑 후에도 형식 위반이 남으면 회색으로 강제
UPDATE voc_types SET color = '#8a8f98' WHERE color !~ '^#[0-9a-fA-F]{6}$';

ALTER TABLE voc_types ALTER COLUMN color SET DEFAULT '#8a8f98';

ALTER TABLE voc_types
  ADD CONSTRAINT voc_types_color_hex_check
  CHECK (color ~ '^#[0-9a-fA-F]{6}$');

-- ─────────────────────────────────────────────────────────────
-- GAP-11: notifications 5분 디바운스 조회용 인덱스 (D8 = DB 조회 기반)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX ON notifications (user_id, type, voc_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- DB Major: vocs.parent_id FK ON DELETE SET NULL
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vocs DROP CONSTRAINT vocs_parent_id_fkey;
ALTER TABLE vocs
  ADD CONSTRAINT vocs_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES vocs(id) ON DELETE SET NULL;
