-- AUTH_MODE=mock 운영을 위한 최소 seed.
-- frontend/backend의 mock fixture(6-6 mockUsers.ts)와 동일한 UUID로 users row를 보장.
-- vocs.author_id 등 NOT NULL FK 위반 방지.
-- dev_seed.sql과 UUID 동일 — 둘 중 하나만 실행해도 충돌 없음.

INSERT INTO users (id, ad_username, display_name, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'mock_admin',   'Mock Admin',   'admin@company.com',   'admin'),
  ('00000000-0000-0000-0000-000000000002', 'mock_manager', 'Mock Manager', 'manager@company.com', 'manager'),
  ('00000000-0000-0000-0000-000000000003', 'mock_user',    'Mock User',    'user@company.com',    'user'),
  ('00000000-0000-0000-0000-000000000004', 'mock_dev',     'Mock Dev',     'dev@company.com',     'dev')
ON CONFLICT (id) DO NOTHING;
