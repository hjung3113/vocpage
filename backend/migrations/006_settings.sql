-- dashboard_settings: 사용자별 대시보드 설정 (user_id NULL = Admin 기본값)
CREATE TABLE dashboard_settings (
  id                    uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               uuid        REFERENCES users(id) UNIQUE,
  widget_order          jsonb       NOT NULL DEFAULT '[]',
  widget_visibility     jsonb       NOT NULL DEFAULT '{}',
  widget_sizes          jsonb       NOT NULL DEFAULT '{}',
  default_date_range    text        NOT NULL DEFAULT '30d'
                                    CHECK (default_date_range IN ('7d','30d','90d','custom')),
  heatmap_default_x_axis text       NOT NULL DEFAULT 'status'
                                    CHECK (heatmap_default_x_axis IN ('status','priority','tag')),
  locked_fields         jsonb       NOT NULL DEFAULT '[]',
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_dashboard_settings_updated_at
  BEFORE UPDATE ON dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- notifications: 알림 (comment·status_change·assigned)
CREATE TABLE notifications (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users(id),
  type       text        NOT NULL CHECK (type IN ('comment','status_change','assigned')),
  voc_id     uuid        NOT NULL REFERENCES vocs(id),
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
