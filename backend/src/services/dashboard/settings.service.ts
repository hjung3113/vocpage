/**
 * Dashboard settings service — merge logic + permission enforcement.
 * Spec: docs/specs/requires/dashboard.md §11.
 */
import type { DashboardSettings } from '../../../../shared/contracts/dashboard';
import type { DashboardSettingsUpdate } from '../../../../shared/contracts/dashboard';
import type { AuthUser } from '../../auth/types';
import { HttpError } from '../../middleware/httpError';
import * as repo from '../../repository/dashboard.repo';
import logger from '../../logger';

/** Zero-state returned when neither admin-default nor user row exists. */
const ZERO_STATE: DashboardSettings = {
  user_id: null,
  widget_order: [],
  widget_visibility: {},
  widget_sizes: {} as DashboardSettings['widget_sizes'],
  locked_fields: [],
  default_date_range: '1m',
  custom_start_date: null,
  custom_end_date: null,
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

  // ADR 0006: custom_start/end_date follow whichever side wins default_date_range.
  // If user picks default_date_range, take user's dates; else admin's.
  const ddrFromUser =
    !locked.has('default_date_range' as keyof DashboardSettings) &&
    user.default_date_range !== null &&
    user.default_date_range !== undefined;
  return {
    user_id: user.user_id,
    widget_order: pick('widget_order'),
    widget_visibility: pick('widget_visibility'),
    widget_sizes: pick('widget_sizes'),
    locked_fields: admin.locked_fields,
    default_date_range: pick('default_date_range'),
    custom_start_date: ddrFromUser ? user.custom_start_date : admin.custom_start_date,
    custom_end_date: ddrFromUser ? user.custom_end_date : admin.custom_end_date,
    heatmap_default_x_axis: pick('heatmap_default_x_axis'),
    globaltabs_order: pick('globaltabs_order'),
    updated_at: user.updated_at ?? admin.updated_at,
  };
}

/**
 * ADR 0006 §6 (OQ-5): invariant 위반 (CHECK 우회 manual SQL 등) 시 응답 직전 500.
 * fallback enum 강등 거부 — 시그널 보존.
 */
function assertCustomDatesInvariant(s: DashboardSettings): void {
  const ddrCustom = s.default_date_range === 'custom';
  const datesPresent = s.custom_start_date != null && s.custom_end_date != null;
  if (ddrCustom !== datesPresent) {
    logger.error(
      {
        event: 'dashboard_settings_invariant_violation',
        user_id: s.user_id,
        default_date_range: s.default_date_range,
        custom_start_date: s.custom_start_date,
        custom_end_date: s.custom_end_date,
      },
      'ADR 0006 invariant violation',
    );
    throw new HttpError(
      500,
      'DASHBOARD_SETTINGS_INVARIANT_VIOLATION',
      'Dashboard settings invariant violation (ADR 0006).',
    );
  }
}

/**
 * Fetch and merge admin-default + user row for the given userId.
 */
export async function loadResolved(userId: string): Promise<DashboardSettings> {
  const [admin, user] = await Promise.all([
    repo.getAdminDefault(),
    repo.getByUserId(userId),
  ]);
  const out = merge(admin, user);
  assertCustomDatesInvariant(out);
  return out;
}


/**
 * Wave 2 Phase E (admin scope): return the raw admin-default row, falling back
 * to ZERO_STATE when no admin row has been written yet. Admin only — caller
 * must enforce role gate before invoking.
 */
export async function loadAdminDefault(): Promise<DashboardSettings> {
  const admin = await repo.getAdminDefault();
  const out = merge(admin, null);
  assertCustomDatesInvariant(out);
  return out;
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

  // ADR 0006 §7: Admin 기본값 행 (`user_id IS NULL`) 에 'custom' 저장 차단.
  // 절대 날짜는 신규 사용자에게 stale → 차단으로 회피. 상대 offset 은 NextGen.
  if (
    targetUserId === null &&
    effectivePatch.default_date_range === 'custom'
  ) {
    throw new HttpError(
      415,
      'ADMIN_CUSTOM_NOT_SUPPORTED',
      "Admin 기본값 행은 default_date_range='custom' 을 지원하지 않습니다 (ADR 0006 §7).",
    );
  }

  // ADR 0006 §5: default_date_range 가 'custom' 이외로 변경되면 picker 값 자동 NULL clear.
  // 'custom' 으로 변경 시 dates 필수 (zod 형태 검증 통과 후 invariant 는 머지된 결과로 검증).
  const normalized: DashboardSettingsUpdate = { ...effectivePatch };
  if (
    normalized.default_date_range !== undefined &&
    normalized.default_date_range !== 'custom'
  ) {
    normalized.custom_start_date = null;
    normalized.custom_end_date = null;
  }

  // Cross-field invariant: 머지된 결과 (existing + patch) 가 ADR §2 CHECK 와 동일해야.
  const existing =
    targetUserId === null
      ? await repo.getAdminDefault()
      : await repo.getByUserId(targetUserId);
  const merged = {
    default_date_range:
      normalized.default_date_range ?? existing?.default_date_range ?? '1m',
    custom_start_date:
      normalized.custom_start_date !== undefined
        ? normalized.custom_start_date
        : (existing?.custom_start_date ?? null),
    custom_end_date:
      normalized.custom_end_date !== undefined
        ? normalized.custom_end_date
        : (existing?.custom_end_date ?? null),
  };
  if (merged.default_date_range === 'custom') {
    if (!merged.custom_start_date || !merged.custom_end_date) {
      throw new HttpError(
        400,
        'CUSTOM_DATES_REQUIRED',
        "default_date_range='custom' 은 custom_start_date / custom_end_date 가 필요합니다.",
      );
    }
    if (merged.custom_start_date > merged.custom_end_date) {
      throw new HttpError(
        400,
        'CUSTOM_DATES_RANGE_INVALID',
        'custom_start_date <= custom_end_date 이어야 합니다.',
      );
    }
  }

  await repo.upsert(targetUserId, normalized);

  // Return freshly-resolved view
  return loadResolved(authUser.id);
}
