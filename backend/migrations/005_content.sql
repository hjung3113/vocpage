-- comments: VOC 댓글 (User 이상 열람, Manager/Admin 포함)
CREATE TABLE comments (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id     uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES users(id),
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- voc_internal_notes: 내부 메모 (Manager/Admin 전용, User에게 404)
CREATE TABLE voc_internal_notes (
  id         bigserial   PRIMARY KEY,
  voc_id     uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES users(id),
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER trg_voc_internal_notes_updated_at
  BEFORE UPDATE ON voc_internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- attachments: VOC 첨부파일 메타데이터 (실파일은 Docker named volume uploads_data)
CREATE TABLE attachments (
  id           uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id       uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  uploader_id  uuid        NOT NULL REFERENCES users(id),
  filename     text        NOT NULL,
  mime_type    text        NOT NULL,
  size_bytes   int         NOT NULL,
  storage_path text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- notices: 공지사항
CREATE TABLE notices (
  id           uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        text        NOT NULL,
  body         text        NOT NULL,
  level        text        NOT NULL DEFAULT 'normal'
                           CHECK (level IN ('normal','important','urgent')),
  is_popup     boolean     NOT NULL DEFAULT false,
  is_visible   boolean     NOT NULL DEFAULT true,
  visible_from date,
  visible_to   date,
  author_id    uuid        NOT NULL REFERENCES users(id),
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- faq_categories: FAQ 카테고리
CREATE TABLE faq_categories (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text    NOT NULL,
  slug        text    NOT NULL UNIQUE,
  sort_order  int     NOT NULL DEFAULT 0,
  is_archived boolean NOT NULL DEFAULT false
);

-- faqs: FAQ 항목
CREATE TABLE faqs (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  question    text        NOT NULL,
  answer      text        NOT NULL,
  category_id uuid        NOT NULL REFERENCES faq_categories(id),
  is_visible  boolean     NOT NULL DEFAULT true,
  sort_order  int         NOT NULL DEFAULT 0,
  author_id   uuid        NOT NULL REFERENCES users(id),
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
