/**
 * Dashboard settings repository — DB access for dashboard_settings table.
 * Spec: docs/specs/requires/dashboard.md §11.
 * DB schema: migrations 006 + 007 + 011 (already applied, no new migration needed).
 */
import { getPool } from '../db';
import type { DashboardSettings } from '../../../shared/contracts/dashboard';
import type { DashboardSettingsUpdate } from '../../../shared/contracts/dashboard';

const COLUMNS = `user_id, widget_order, widget_visibility, widget_sizes,
  locked_fields, default_date_range, heatmap_default_x_axis,
  globaltabs_order, updated_at`;

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function row(r: Record<string, unknown>): DashboardSettings {
  return {
    user_id: (r.user_id as string | null) ?? null,
    widget_order: (r.widget_order as string[]) ?? [],
    widget_visibility: (r.widget_visibility as Record<string, boolean>) ?? {},
    widget_sizes: (r.widget_sizes as DashboardSettings['widget_sizes']) ?? {},
    locked_fields: (r.locked_fields as string[]) ?? [],
    default_date_range: r.default_date_range as DashboardSettings['default_date_range'],
    heatmap_default_x_axis: r.heatmap_default_x_axis as DashboardSettings['heatmap_default_x_axis'],
    globaltabs_order:
      (r.globaltabs_order as DashboardSettings['globaltabs_order']) ?? null,
    updated_at: toIso(r.updated_at),
  };
}

export async function getByUserId(userId: string): Promise<DashboardSettings | null> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT ${COLUMNS} FROM dashboard_settings WHERE user_id = $1`,
    [userId],
  );
  return r.rows[0] ? row(r.rows[0]) : null;
}

export async function getAdminDefault(): Promise<DashboardSettings | null> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT ${COLUMNS} FROM dashboard_settings WHERE user_id IS NULL`,
  );
  return r.rows[0] ? row(r.rows[0]) : null;
}

/**
 * Upsert a dashboard_settings row. If userId is null, targets the admin-default
 * row (user_id IS NULL). Only columns present in patch are updated.
 */
export async function upsert(
  userId: string | null,
  patch: DashboardSettingsUpdate,
): Promise<DashboardSettings> {
  const pool = getPool();

  // Build column lists for INSERT + UPDATE from patch keys
  const patchEntries = Object.entries(patch).filter(([, v]) => v !== undefined);
  const args: unknown[] = [userId];

  if (patchEntries.length === 0) {
    // Nothing to patch — upsert an empty row (no-op for existing, create stub for new)
    const r = await pool.query(
      `INSERT INTO dashboard_settings (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
         RETURNING ${COLUMNS}`,
      [userId],
    );
    return row(r.rows[0]);
  }

  const setClauses: string[] = [];
  for (const [k, v] of patchEntries) {
    args.push(v);
    setClauses.push(`${k} = $${args.length}`);
  }

  // Build INSERT column/value lists
  const insertCols = ['user_id', ...patchEntries.map(([k]) => k)].join(', ');
  const insertVals = ['$1', ...patchEntries.map((_, i) => `$${i + 2}`)].join(', ');

  const updateSet = [...setClauses, 'updated_at = now()'].join(', ');

  const r = await pool.query(
    `INSERT INTO dashboard_settings (${insertCols})
       VALUES (${insertVals})
       ON CONFLICT (user_id) DO UPDATE SET ${updateSet}
       RETURNING ${COLUMNS}`,
    args,
  );
  return row(r.rows[0]);
}
