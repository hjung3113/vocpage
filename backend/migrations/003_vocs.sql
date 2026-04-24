-- 시스템×연도별 sequence_no 카운터 테이블
CREATE TABLE voc_sequence_counters (
  system_id uuid NOT NULL REFERENCES systems(id),
  year      int  NOT NULL,
  last_seq  int  NOT NULL DEFAULT 0,
  PRIMARY KEY (system_id, year)
);

-- sequence_no 자동 채번 트리거 함수
-- BEFORE INSERT 시점에 실행 → created_at DEFAULT(now())가 이미 적용된 상태
CREATE OR REPLACE FUNCTION generate_voc_sequence_no()
RETURNS TRIGGER AS $$
DECLARE
  v_year int;
  v_seq  int;
BEGIN
  v_year := EXTRACT(YEAR FROM NEW.created_at)::int;

  INSERT INTO voc_sequence_counters (system_id, year, last_seq)
  VALUES (NEW.system_id, v_year, 1)
  ON CONFLICT (system_id, year)
  DO UPDATE SET last_seq = voc_sequence_counters.last_seq + 1
  RETURNING last_seq INTO v_seq;

  NEW.sequence_no := v_seq;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- vocs: VOC 메인 테이블
CREATE TABLE vocs (
  id                        uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  title                     text        NOT NULL,
  body                      text        NOT NULL,
  status                    text        NOT NULL DEFAULT '접수'
                                        CHECK (status IN ('접수','검토중','처리중','완료','드랍')),
  priority                  text        NOT NULL DEFAULT 'medium'
                                        CHECK (priority IN ('low','medium','high','urgent')),
  reporter_id               uuid        NOT NULL REFERENCES users(id),
  assignee_id               uuid        REFERENCES users(id),
  system_id                 uuid        NOT NULL REFERENCES systems(id),
  menu_id                   uuid        REFERENCES menus(id),
  voc_type_id               uuid        REFERENCES voc_types(id),
  sequence_no               int,
  structured_payload        jsonb,
  structured_payload_draft  jsonb,
  review_status             text        CHECK (review_status IN ('unverified','approved','rejected','pending_deletion')),
  embed_stale               boolean     NOT NULL DEFAULT false,
  embedding                 vector(1536),
  resolution_quality        text        CHECK (resolution_quality IN ('근본해결','임시조치')),
  drop_reason               text        CHECK (drop_reason IN ('중복','정책거부','재현불가','범위외','기타')),
  source                    text        NOT NULL DEFAULT 'manual'
                                        CHECK (source IN ('manual','import')),
  deleted_at                timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_voc_sequence_no
  BEFORE INSERT ON vocs
  FOR EACH ROW
  WHEN (NEW.sequence_no IS NULL)
  EXECUTE FUNCTION generate_voc_sequence_no();

CREATE TRIGGER trg_vocs_updated_at
  BEFORE UPDATE ON vocs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- voc_history: 필드 변경 이력
CREATE TABLE voc_history (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id      uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  field       text        NOT NULL,
  old_value   text,
  new_value   text,
  changed_by  uuid        NOT NULL REFERENCES users(id),
  changed_at  timestamptz NOT NULL DEFAULT now()
);

-- voc_payload_reviews: structured_payload 리뷰 이력
CREATE TABLE voc_payload_reviews (
  id              uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id          uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  action          text        NOT NULL CHECK (action IN ('submission','deletion')),
  reviewer_id     uuid        NOT NULL REFERENCES users(id),
  decision        text        NOT NULL CHECK (decision IN ('approved','rejected')),
  comment         text,
  is_self_review  boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- voc_payload_history: structured_payload 제출 스냅샷
CREATE TABLE voc_payload_history (
  id            uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id        uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  payload       jsonb       NOT NULL,
  submitted_by  uuid        NOT NULL REFERENCES users(id),
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  final_state   text        CHECK (final_state IN ('approved','rejected','deleted','active')),
  is_current    boolean     NOT NULL DEFAULT false
);
