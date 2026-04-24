-- updated_at 자동 갱신 트리거 함수 (공통 재사용)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users: AD 기반 사용자. MVP에서는 mock fixture와 UUID 일치 필수
CREATE TABLE users (
  id            uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_username   text        NOT NULL UNIQUE,
  display_name  text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  role          text        NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'manager', 'admin')),
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- systems: VOC가 속하는 원천 시스템 (분석시스템, 생산관리 등)
CREATE TABLE systems (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  is_archived boolean     NOT NULL DEFAULT false
);

-- menus: 시스템 내 메뉴 (화면 단위)
CREATE TABLE menus (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  system_id   uuid        NOT NULL REFERENCES systems(id),
  name        text        NOT NULL,
  slug        text        NOT NULL,
  is_archived boolean     NOT NULL DEFAULT false,
  UNIQUE (system_id, slug)
);

-- voc_types: VOC 분류 (버그·기능요청·개선제안·문의)
CREATE TABLE voc_types (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  color       text        NOT NULL DEFAULT 'gray',
  sort_order  int         NOT NULL DEFAULT 0,
  is_archived boolean     NOT NULL DEFAULT false
);
