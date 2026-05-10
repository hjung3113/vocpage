/**
 * @module shared/contracts/dashboard/assignee-stats
 *
 * Contract for `GET /api/dashboard/assignee-stats`.
 * Spec: `docs/specs/requires/dashboard.md` §8 (담당자별 처리 현황 v3).
 *
 * Shares the same xAxis selector as heatmap but is independently controlled
 * (spec: "히트맵과 독립 선택"). Columns + intensity model identical to heatmap.
 *
 * The "미배정" row is always present (spec §8 Y축 구조) with id = null and
 * is_unassigned = true. The widget uses `is_unassigned` to apply italic +
 * var(--text-quaternary) styling and to build ?assigneeId=unassigned URLs.
 *
 * Intensity shading: `max_value` across all data rows (same model as heatmap).
 */
import { z } from 'zod';
import {
  DashboardFilterBase,
  requireDatesForCustomRange,
  requireDatesForCustomRangeError,
} from './summary';
import { HeatmapXAxis } from './entity';

export const AssigneeStatRow = z
  .object({
    /** UUID of the user. Null for the 미배정 row. */
    id: z.string().uuid().nullable(),
    /** Display name. "미배정" for the unassigned row. */
    name: z.string().min(1),
    /** True only for the 미배정 aggregate row. */
    is_unassigned: z.boolean(),
    /** Count per X-axis column, length === headers.length. */
    values: z.array(z.number().int().nonnegative()),
    /** Row sub-total. */
    total: z.number().int().nonnegative(),
  })
  .strict();
export type AssigneeStatRow = z.infer<typeof AssigneeStatRow>;

export const AssigneeStatsResponse = z
  .object({
    /** X-axis column labels matching the xAxis param. */
    headers: z.array(z.string().min(1)),
    /** Ordered: named assignees (name-sorted) then 미배정 last. */
    rows: z.array(AssigneeStatRow),
    /** Max cell value across named-assignee rows (미배정 excluded from normalisation). */
    max_value: z.number().int().nonnegative(),
  })
  .strict();
export type AssigneeStatsResponse = z.infer<typeof AssigneeStatsResponse>;

/** Query params for GET /api/dashboard/assignee-stats. */
export const AssigneeStatsFilter = DashboardFilterBase.extend({
  xAxis: HeatmapXAxis.optional(),
}).refine(requireDatesForCustomRange, requireDatesForCustomRangeError);
export type AssigneeStatsFilter = z.infer<typeof AssigneeStatsFilter>;
