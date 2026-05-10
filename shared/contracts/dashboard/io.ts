/**
 * @module shared/contracts/dashboard/io
 *
 * Request/response schemas for `/api/dashboard/settings`.
 * Spec: `docs/specs/requires/dashboard.md` §11 + Wave 2 Phase D plan.
 *
 * Authorization (enforced server-side, not in zod):
 * - `locked_fields` mutation requires Admin role (§11 lock hierarchy).
 * - `globaltabs_order` mutation requires Admin role and only persists on the
 *   admin-default row (`user_id IS NULL`).
 */
import { z } from 'zod';
import {
  DashboardSettings,
  RglLayouts,
  DateRangePreset,
  HeatmapXAxis,
  GlobalTabsOrderItem,
} from './entity';

export const DashboardSettingsResponse = DashboardSettings;
export type DashboardSettingsResponse = z.infer<typeof DashboardSettingsResponse>;

export const DashboardSettingsUpdate = z
  .object({
    widget_order: z.array(z.string()).optional(),
    widget_visibility: z.record(z.string(), z.boolean()).optional(),
    widget_sizes: RglLayouts.optional(),
    locked_fields: z.array(z.string()).optional(),
    default_date_range: DateRangePreset.optional(),
    heatmap_default_x_axis: HeatmapXAxis.optional(),
    globaltabs_order: z.array(GlobalTabsOrderItem).nullable().optional(),
  })
  .strict();
export type DashboardSettingsUpdate = z.infer<typeof DashboardSettingsUpdate>;
