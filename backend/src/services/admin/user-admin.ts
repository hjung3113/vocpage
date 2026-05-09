/**
 * User Admin service (W3-7 Phase E)
 *
 * Business logic layer for admin user operations.
 * Spec: requirements.md §15.2 + ADR 0004 (Admin only).
 *
 * Permission enforcement is done at the route layer (requireAdmin).
 * This service handles DB-level constraints and business rules:
 *  - Last-admin guard: role demotion / is_active=false that reduces admin count to 0 → throws CONFLICT 409
 *  - Audit: every successful role/is_active change → INSERT into user_role_log (migration 017)
 */
import { getPool } from '../../db';
import type {
  AdminUserListQuery,
  AdminUserPatch,
} from '../../../../shared/contracts/admin/user';

// ─── List ────────────────────────────────────────────────────────────────────

export async function listUsers(query: AdminUserListQuery) {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (query.role) {
    conditions.push(`u.role = $${i++}`);
    values.push(query.role);
  }
  if (query.is_active !== undefined) {
    conditions.push(`u.is_active = $${i++}`);
    values.push(query.is_active);
  }
  if (query.q) {
    conditions.push(
      `(u.display_name ILIKE $${i} OR u.email ILIKE $${i} OR u.ad_username ILIKE $${i++})`,
    );
    values.push(`%${query.q.replace(/[%_\\]/g, '\\$&')}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (query.page - 1) * query.per_page;

  const countSql = `SELECT COUNT(*) AS total FROM users u ${where}`;
  const rowsSql = `
    SELECT
      u.id,
      u.ad_username,
      u.display_name,
      u.email,
      u.role,
      u.is_active,
      u.created_at
    FROM users u
    ${where}
    ORDER BY u.display_name ASC
    LIMIT $${i++} OFFSET $${i++}
  `;

  const countValues = [...values];
  const rowValues = [...values, query.per_page, offset];

  const [countResult, rowsResult] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(rowsSql, rowValues),
  ]);

  return {
    rows: rowsResult.rows,
    page: query.page,
    per_page: query.per_page,
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

// ─── Patch (role / is_active) ─────────────────────────────────────────────────

export async function patchUser(
  id: string,
  patch: AdminUserPatch,
  changedBy: string,
): Promise<{
  id: string;
  ad_username: string;
  display_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch current user state
    const { rows: current } = await client.query<{
      id: string;
      ad_username: string;
      display_name: string;
      email: string;
      role: string;
      is_active: boolean;
      created_at: string;
    }>(
      'SELECT id, ad_username, display_name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id],
    );

    if (current.length === 0) {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { code: 'NOT_FOUND' });
    }

    const user = current[0]!;
    const newRole = patch.role ?? user.role;
    const newActive = patch.is_active ?? user.is_active;

    // Last-admin guard: reject if this change would leave 0 active admins (§6.1, spec §15.2 / W3-7 line 114)
    const isAdminDemotion = user.role === 'admin' && newRole !== 'admin';
    const isAdminDeactivation = user.role === 'admin' && user.is_active && !newActive;

    if (isAdminDemotion || isAdminDeactivation) {
      const { rows: adminCount } = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = true AND id != $1`,
        [id],
      );
      const remainingAdmins = Number(adminCount[0]?.count ?? 0);
      if (remainingAdmins === 0) {
        await client.query('ROLLBACK');
        throw Object.assign(
          new Error('마지막 Admin 계정은 강등하거나 비활성화할 수 없습니다.'),
          { code: 'CONFLICT' },
        );
      }
    }

    // Update user
    const { rows: updated } = await client.query<{
      id: string;
      ad_username: string;
      display_name: string;
      email: string;
      role: string;
      is_active: boolean;
      created_at: string;
    }>(
      `UPDATE users SET role = $1, is_active = $2 WHERE id = $3
       RETURNING id, ad_username, display_name, email, role, is_active, created_at`,
      [newRole, newActive, id],
    );

    const updatedUser = updated[0];
    if (!updatedUser) {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { code: 'NOT_FOUND' });
    }

    // Audit log (migration 017): record role/is_active changes
    await client.query(
      `INSERT INTO user_role_log (user_id, changed_by, old_role, new_role, old_active, new_active, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        changedBy,
        user.role !== newRole ? user.role : null,
        user.role !== newRole ? newRole : null,
        user.is_active !== newActive ? user.is_active : null,
        user.is_active !== newActive ? newActive : null,
        patch.reason ?? null,
      ],
    );

    await client.query('COMMIT');
    return updatedUser;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
