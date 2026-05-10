/**
 * @module shared/contracts/dashboard/summary
 *
 * KPI summary contract for `GET /api/dashboard/summary`. Matches
 * `shared/openapi.yaml#/components/schemas/DashboardSummary`.
 *
 * Spec: `docs/specs/requires/dashboard.md` §1 (KPI cards 8종 — 2 rows × 4
 * cards: Volume + Quality). Each metric is `{ value, delta, delta_kind }`
 * where `delta_kind` clarifies the units used for the prior-period delta
 * so the UI can render arrow direction + sign formatting deterministically.
 *
 * `delta` may be null when the comparison window is empty (e.g. `range=all`
 * has no prior period; or "이번주 X" KPIs in week 1 of a fresh dataset).
 */
import { z } from 'zod';
import { Uuid } from '../common';
import { DateRangePreset } from './entity';

export const KpiDeltaKind = z.enum(['percent', 'count', 'days', 'percentage_point']);
export type KpiDeltaKind = z.infer<typeof KpiDeltaKind>;

export const KpiMetric = z
  .object({
    value: z.number(),
    delta: z.number().nullable(),
    delta_kind: KpiDeltaKind,
  })
  .strict();
export type KpiMetric = z.infer<typeof KpiMetric>;

export const KpiVolume = z
  .object({
    total_voc: KpiMetric,
    unresolved: KpiMetric,
    this_week_new: KpiMetric,
    this_week_completed: KpiMetric,
  })
  .strict();
export type KpiVolume = z.infer<typeof KpiVolume>;

export const KpiQuality = z
  .object({
    avg_resolution_days: KpiMetric,
    resolution_rate: KpiMetric,
    urgent_high_unresolved: KpiMetric,
    overdue_14d: KpiMetric,
  })
  .strict();
export type KpiQuality = z.infer<typeof KpiQuality>;

export const DashboardSummary = z
  .object({
    kpi_volume: KpiVolume,
    kpi_quality: KpiQuality,
  })
  .strict();
export type DashboardSummary = z.infer<typeof DashboardSummary>;

/**
 * `GET /api/dashboard/summary` query string. All params optional.
 * - `range` overrides the user's `dashboard_settings.default_date_range`.
 * - `startDate` / `endDate` are required iff `range=custom` (validated server-side).
 * - Dates are calendar dates in `YYYY-MM-DD` form, interpreted at KST midnight.
 */
/**
 * Base object schema — exported so child filter schemas can call `.extend()`.
 * Use `DashboardFilter` (the refined version) for direct route validation.
 */
export const DashboardFilterBase = z
  .object({
    systemId: Uuid.optional(),
    menuId: Uuid.optional(),
    assigneeId: Uuid.optional(),
    range: DateRangePreset.optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

/**
 * Reusable refine for range=custom date requirement.
 * Apply to any schema that extends DashboardFilterBase.
 */
export function requireDatesForCustomRange<
  T extends { range?: string; startDate?: string; endDate?: string },
>(v: T): boolean {
  return v.range !== 'custom' || (!!v.startDate && !!v.endDate);
}
export const requireDatesForCustomRangeError: {
  message: string;
  path: string[];
} = {
  message: 'startDate and endDate are required when range=custom',
  path: ['startDate'],
};

export const DashboardFilter = DashboardFilterBase.refine(
  requireDatesForCustomRange,
  requireDatesForCustomRangeError,
);
export type DashboardFilter = z.infer<typeof DashboardFilter>;
