/**
 * MSW handlers for Admin Users endpoints (W3-7)
 * Mirrors backend /api/admin/users shape.
 * Responses validated against shared Zod contracts.
 */
import { http, HttpResponse } from 'msw';
import {
  AdminUserListResponse,
  AdminUserItem,
} from '../../../../../shared/contracts/admin/user';
import {
  ADMIN_USER_FIXTURES,
  USER_IDS,
} from '../../../../../shared/fixtures/admin-user.fixtures';

// Mutable in-memory store for test mutations
let userStore = [...ADMIN_USER_FIXTURES];

export function resetUserStore() {
  userStore = [...ADMIN_USER_FIXTURES];
}

export const adminUsersHandlers = [
  // GET /api/admin/users
  http.get('/api/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const isActiveParam = url.searchParams.get('is_active');
    const q = url.searchParams.get('q')?.toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 1);
    const per_page = Number(url.searchParams.get('per_page') ?? 20);

    let rows = [...userStore];
    if (role) rows = rows.filter((u) => u.role === role);
    if (isActiveParam !== null)
      rows = rows.filter((u) => u.is_active === (isActiveParam === 'true'));
    if (q)
      rows = rows.filter(
        (u) =>
          u.display_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.ad_username.toLowerCase().includes(q),
      );

    const total = rows.length;
    const offset = (page - 1) * per_page;
    rows = rows.slice(offset, offset + per_page);

    const body = AdminUserListResponse.parse({ rows, page, per_page, total });
    return HttpResponse.json(body);
  }),

  // PATCH /api/admin/users/:id
  http.patch('/api/admin/users/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as {
      role?: string;
      is_active?: boolean;
      reason?: string;
    };

    const idx = userStore.findIndex((u) => u.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }

    const user = userStore[idx]!;

    // Last-admin guard
    const newRole = (body.role ?? user.role) as typeof user.role;
    const newActive = body.is_active ?? user.is_active;
    const isAdminDemotion = user.role === 'admin' && newRole !== 'admin';
    const isAdminDeactivation = user.role === 'admin' && user.is_active && !newActive;

    if (isAdminDemotion || isAdminDeactivation) {
      const remainingAdmins = userStore.filter(
        (u) => u.id !== id && u.role === 'admin' && u.is_active,
      ).length;
      if (remainingAdmins === 0) {
        return HttpResponse.json(
          {
            code: 'CONFLICT',
            message: '마지막 Admin 계정은 강등하거나 비활성화할 수 없습니다.',
            details: null,
          },
          { status: 409 },
        );
      }
    }

    const updated = AdminUserItem.parse({
      ...user,
      role: newRole,
      is_active: newActive,
    });
    userStore[idx] = updated;
    return HttpResponse.json(updated);
  }),
];

// Export stable IDs for use in tests
export { USER_IDS };
