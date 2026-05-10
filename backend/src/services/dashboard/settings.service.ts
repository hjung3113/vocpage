/**
 * Dashboard settings service — merge logic + permission enforcement.
 * Spec: docs/specs/requires/dashboard.md §11.
 */
import type { DashboardSettings } from '../../../../shared/contracts/dashboard';
import type { DashboardSettingsUpdate } from '../../../../shared/contracts/dashboard';
import type { AuthUser } from '../../auth/types';
import { HttpError } from '../../middleware/httpError';
import * as repo from '../../repository/dashboard.repo';

/** Zero-state returned when neither admin-default nor user row exists. */
const ZERO_STATE: DashboardSettings = {
  user_id: null,
  widget_order: [],
  widget_visibility: {},
  widget_sizes: {} as DashboardSettings['widget_sizes'],
  locked_fields: [],
  default_date_range: '1m',
  heatmap_default_x_axis: 'status',
  globaltabs_order: null,
  updated_at: new Date(0).toISOString(),
};

/**
 * Merge admin default + user row per locked_fields rule:
 * - If field is in admin.locked_fields → use admin value.
 * - Else if user row has non-null value → use user value.
 * - Else → use admin default.
 */
function merge(
  admin: DashboardSettings | null,
  user: DashboardSettings | null,
): DashboardSettings {
  if (!admin && !user) return ZERO_STATE;
  if (!admin) return user!;
  if (!user) return { ...admin };

  const locked = new Set(admin.locked_fields ?? []);

  const pick = <K extends keyof DashboardSettings>(key: K): DashboardSettings[K] => {
    if (locked.has(key)) return admin[key];
    const uv = user[key];
    return uv !== null && uv !== undefined ? uv : admin[key];
  };

  return {
    user_id: user.user_id,
    widget_order: pick('widget_order'),
    widget_visibility: pick('widget_visibility'),
    widget_sizes: pick('widget_sizes'),
    locked_fields: admin.locked_fields,
    default_date_range: pick('default_date_range'),
    heatmap_default_x_axis: pick('heatmap_default_x_axis'),
    globaltabs_order: pick('globaltabs_order'),
    updated_at: user.updated_at ?? admin.updated_at,
  };
}

/**
 * Fetch and merge admin-default + user row for the given userId.
 */
export async function loadResolved(userId: string): Promise<DashboardSettings> {
  const [admin, user] = await Promise.all([
    repo.getAdminDefault(),
    repo.getByUserId(userId),
  ]);
  return merge(admin, user);
}


/**
 * Wave 2 Phase E (admin scope): return the raw admin-default row, falling back
 * to ZERO_STATE when no admin row has been written yet. Admin only — caller
 * must enforce role gate before invoking.
 */
export async function loadAdminDefault(): Promise<DashboardSettings> {
  const admin = await repo.getAdminDefault();
  return merge(admin, null);
}

/**
 * Apply a settings update with permission enforcement + lock-field silencing.
 *
 * @param scope 'self' = write to user row; 'admin' = write to admin-default (null user_id).
 */
export async function update(
  authUser: AuthUser,
  patch: DashboardSettingsUpdate,
  scope: 'self' | 'admin',
): Promise<DashboardSettings> {
  const isAdmin = authUser.role === 'admin';

  // P1-1: scope=admin is restricted to role=admin
  if (scope === 'admin' && !isAdmin) {
    throw new HttpError(403, 'FORBIDDEN_ADMIN_SCOPE', '관리자만 scope=admin으로 설정할 수 있습니다.');
  }

  // P1-2: locked_fields may only be changed via scope=admin
  if (patch.locked_fields !== undefined && scope !== 'admin') {
    throw new HttpError(
      403,
      'FORBIDDEN_LOCKED_FIELDS_SCOPE',
      'locked_fields는 ?scope=admin 으로만 변경 가능합니다.',
    );
  }

  // P1-3: globaltabs_order may only be changed via scope=admin
  if (patch.globaltabs_order !== undefined && scope !== 'admin') {
    throw new HttpError(
      403,
      'FORBIDDEN_GLOBALTABS_ORDER_SCOPE',
      'globaltabs_order는 ?scope=admin 으로만 변경 가능합니다.',
    );
  }

  // Legacy guard: non-admin trying to set locked_fields/globaltabs_order
  // already blocked above (they'd need scope=admin which is also blocked).
  // Keep explicit role check for clarity if code paths change.
  if (patch.locked_fields !== undefined && !isAdmin) {
    throw new HttpError(403, 'FORBIDDEN_LOCKED_FIELDS', '권한이 없습니다.');
  }
  if (patch.globaltabs_order !== undefined && !isAdmin) {
    throw new HttpError(403, 'FORBIDDEN_GLOBALTABS_ORDER', '권한이 없습니다.');
  }

  // For non-admin users: silently drop any admin-locked fields from the patch
  const effectivePatch: DashboardSettingsUpdate = { ...patch };
  if (!isAdmin) {
    const adminRow = await repo.getAdminDefault();
    const locked = new Set(adminRow?.locked_fields ?? []);
    for (const key of Object.keys(effectivePatch) as Array<keyof DashboardSettingsUpdate>) {
      if (locked.has(key)) {
        delete effectivePatch[key];
      }
    }
  }

  // Determine target user_id
  const targetUserId: string | null =
    scope === 'admin' && isAdmin ? null : authUser.id;

  await repo.upsert(targetUserId, effectivePatch);

  // Return freshly-resolved view
  return loadResolved(authUser.id);
}
