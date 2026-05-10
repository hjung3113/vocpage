/**
 * @module shared/contracts/dashboard/heatmap
 *
 * Contract for `GET /api/dashboard/heatmap`.
 * Spec: `docs/specs/requires/dashboard.md` §4 (드릴다운 히트맵 v3).
 *
 * The response shape mirrors the spec's `응답` block:
 *   { headers, totalRow, rows }
 *
 * `totalRow` is null when `menuId` is supplied (spec §4 레벨 3: single row,
 * no summary row). `max_value` enables client-side intensity interpolation
 * (oklch(63% 0.19 258 / 0.06–0.62)) without a second pass over rows.
 *
 * Y-axis row identity (`id`, `level`) lets the widget decide whether to render
 * the drill-down arrow (`level === 'system'`) and handle breadcrumb navigation.
 */
import { z } from 'zod';
import {
  DashboardFilterBase,
  requireDatesForCustomRange,
  requireDatesForCustomRangeError,
} from './summary';
import { HeatmapXAxis } from './entity';

/** One data row in the heatmap table. */
export const HeatmapRow = z
  .object({
    /** Display name (system name, menu name, or "전체"). */
    name: z.string().min(1),
    /**
     * Opaque identifier for click-through (systemId or menuId UUID).
     * Null for the "전체" aggregate row at level 1.
     */
    id: z.string().uuid().nullable(),
    /** Row level — drives drill-down arrow icon and click behavior. */
    level: z.enum(['all', 'system', 'menu']),
    /** Count per X-axis column, length === headers.length. */
    values: z.array(z.number().int().nonnegative()),
    /** Row sub-total. */
    total: z.number().int().nonnegative(),
  })
  .strict();
export type HeatmapRow = z.infer<typeof HeatmapRow>;

export const HeatmapResponse = z
  .object({
    /** X-axis column labels (e.g. ["접수","검토중",...] or ["Urgent",...] or top-5 tag names). */
    headers: z.array(z.string().min(1)),
    /**
     * Summary row values (same length as headers + grand total).
     * Null when the request includes menuId (level 3 = single row, no summary).
     */
    totalRow: z.array(z.number().int().nonnegative()).nullable(),
    rows: z.array(HeatmapRow),
    /** Max cell value across all data rows — used for intensity interpolation. */
    max_value: z.number().int().nonnegative(),
  })
  .strict();
export type HeatmapResponse = z.infer<typeof HeatmapResponse>;

/** Query params for GET /api/dashboard/heatmap. */
export const HeatmapFilter = DashboardFilterBase.extend({
  xAxis: HeatmapXAxis.optional(),
}).refine(requireDatesForCustomRange, requireDatesForCustomRangeError);
export type HeatmapFilter = z.infer<typeof HeatmapFilter>;
