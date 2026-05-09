/**
 * @module shared/fixtures/admin-user.fixtures
 *
 * Admin Users fixtures for:
 *  - FE MSW handlers (frontend/src/test/mocks/handlers/admin-users.ts)
 *  - BE Jest tests (mock service injection)
 *
 * Design: stable UUIDs, covers all 4 roles, active/inactive states,
 * last-admin guard scenario (single admin).
 *
 * Every row passes AdminUserItem.parse() and AdminUserListResponse.parse().
 */
import {
  AdminUserItem,
  type AdminUserItem as AdminUserItemT,
  AdminUserListResponse,
  type AdminUserListResponse as AdminUserListResponseT,
} from '../contracts/admin/user';

// ─── Stable IDs ───────────────────────────────────────────────────────────────

export const USER_IDS = {
  admin_main: 'a0000001-a000-4000-8000-a00000000001',
  manager_lee: 'a0000002-a000-4000-8000-a00000000002',
  dev_kim: 'a0000003-a000-4000-8000-a00000000003',
  user_park: 'a0000004-a000-4000-8000-a00000000004',
  user_inactive: 'a0000005-a000-4000-8000-a00000000005', // is_active = false
} as const;

// ─── User items ───────────────────────────────────────────────────────────────

const raw: AdminUserItemT[] = [
  AdminUserItem.parse({
    id: USER_IDS.admin_main,
    ad_username: 'admin.main',
    display_name: '관리자',
    email: 'admin.main@example.com',
    role: 'admin',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  }),
  AdminUserItem.parse({
    id: USER_IDS.manager_lee,
    ad_username: 'lee.manager',
    display_name: '이매니저',
    email: 'lee.manager@example.com',
    role: 'manager',
    is_active: true,
    created_at: '2026-01-05T00:00:00.000Z',
  }),
  AdminUserItem.parse({
    id: USER_IDS.dev_kim,
    ad_username: 'kim.dev',
    display_name: '김개발',
    email: 'kim.dev@example.com',
    role: 'dev',
    is_active: true,
    created_at: '2026-01-10T00:00:00.000Z',
  }),
  AdminUserItem.parse({
    id: USER_IDS.user_park,
    ad_username: 'park.user',
    display_name: '박일반',
    email: 'park.user@example.com',
    role: 'user',
    is_active: true,
    created_at: '2026-01-15T00:00:00.000Z',
  }),
  AdminUserItem.parse({
    id: USER_IDS.user_inactive,
    ad_username: 'inactive.user',
    display_name: '비활성사용자',
    email: 'inactive.user@example.com',
    role: 'user',
    is_active: false,
    created_at: '2026-01-20T00:00:00.000Z',
  }),
];

export const ADMIN_USER_FIXTURES: AdminUserItemT[] = raw;

export const ADMIN_USER_LIST_RESPONSE: AdminUserListResponseT = AdminUserListResponse.parse({
  rows: raw,
  page: 1,
  per_page: 20,
  total: raw.length,
});
