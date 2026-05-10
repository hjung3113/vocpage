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
  CustomDate,
} from './entity';

export const DashboardSettingsResponse = DashboardSettings;
export type DashboardSettingsResponse = z.infer<typeof DashboardSettingsResponse>;

/**
 * ADR 0006: PUT body. `default_date_range` 와 `custom_start_date / custom_end_date`
 * 의 cross-field invariant 는 patch 단독으로는 검증 불가 (예: dates 만 수정 +
 * default_date_range 미포함). 따라서 io 단계는 *형태* 만 검증 — 시맨틱
 * invariant 는 service 가 기존 row 와 머지 후 entity 스키마로 재검증한다.
 */
export const DashboardSettingsUpdate = z
  .object({
    widget_order: z.array(z.string()).optional(),
    widget_visibility: z.record(z.string(), z.boolean()).optional(),
    widget_sizes: RglLayouts.optional(),
    locked_fields: z.array(z.string()).optional(),
    default_date_range: DateRangePreset.optional(),
    custom_start_date: CustomDate.nullable().optional(),
    custom_end_date: CustomDate.nullable().optional(),
    heatmap_default_x_axis: HeatmapXAxis.optional(),
    globaltabs_order: z.array(GlobalTabsOrderItem).nullable().optional(),
  })
  .strict();
export type DashboardSettingsUpdate = z.infer<typeof DashboardSettingsUpdate>;
