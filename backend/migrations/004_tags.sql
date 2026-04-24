-- tags: general(자동 태깅 대상) | menu(메뉴 연결 태그)
CREATE TABLE tags (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  kind       text        NOT NULL DEFAULT 'general'
                         CHECK (kind IN ('general','menu')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- voc_tags: VOC ↔ 태그 N:M (source: manual 수동 | rule 자동 규칙)
CREATE TABLE voc_tags (
  voc_id     uuid        NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  tag_id     uuid        NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source     text        NOT NULL DEFAULT 'manual'
                         CHECK (source IN ('manual','rule')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (voc_id, tag_id)
);

-- tag_rules: kind='general' 자동 부착 규칙 (키워드·정규식 매칭)
CREATE TABLE tag_rules (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       text        NOT NULL,
  pattern    text        NOT NULL,
  kind       text        NOT NULL DEFAULT 'general'
                         CHECK (kind IN ('general')),
  tag_id     uuid        NOT NULL REFERENCES tags(id),
  is_active  boolean     NOT NULL DEFAULT true,
  sort_order int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
