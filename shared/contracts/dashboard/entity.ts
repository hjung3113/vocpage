/**
 * @module shared/contracts/dashboard/entity
 *
 * Dashboard settings entity Zod schemas. Single source of truth for FE+BE
 * runtime validation. Aligns with
 * `shared/openapi.yaml#/components/schemas/DashboardSettings`.
 *
 * DB schema: `backend/migrations/006_settings.sql` +
 * `007_add_globaltabs_order.sql` + `011_pre_impl_alignment.sql` (date-range enum).
 *
 * Spec: `docs/specs/requires/dashboard.md` §11 (settings hierarchy: Admin
 * default → personal → session) + Wave 2 Phase D plan.
 */
import { z } from 'zod';
import { Uuid } from '../common';

const Iso = z.string().datetime({ offset: true });

/** react-grid-layout layout item. `i` is the widget id.
 * P2-1: .strict() matches `additionalProperties: false` in openapi. */
export const RglLayoutItem = z.object({
  i: z.string().min(1),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  minW: z.number().int().positive().optional(),
  minH: z.number().int().positive().optional(),
  static: z.boolean().optional(),
}).strict();
export type RglLayoutItem = z.infer<typeof RglLayoutItem>;

export const RglBreakpoint = z.enum(['xs', 'sm', 'md', 'lg', 'xl']);
export type RglBreakpoint = z.infer<typeof RglBreakpoint>;

/**
 * widget_sizes column shape: per-breakpoint RGL layouts.
 * P1-5: all breakpoints are optional — BE zero-state returns `{}` which must
 * parse without error. Using explicit z.object with optional() keys is more
 * codegen-friendly and explicit than z.record(enum).
 */
export const RglLayouts = z.object({
  xs: z.array(RglLayoutItem).optional(),
  sm: z.array(RglLayoutItem).optional(),
  md: z.array(RglLayoutItem).optional(),
  lg: z.array(RglLayoutItem).optional(),
  xl: z.array(RglLayoutItem).optional(),
});
export type RglLayouts = z.infer<typeof RglLayouts>;

export const DateRangePreset = z.enum(['1m', '3m', '1y', 'all', 'custom']);
export type DateRangePreset = z.infer<typeof DateRangePreset>;

export const HeatmapXAxis = z.enum(['status', 'priority', 'tag']);
export type HeatmapXAxis = z.infer<typeof HeatmapXAxis>;

export const GlobalTabsOrderItem = z.object({
  systemId: z.string().min(1),
  visible: z.boolean(),
});
export type GlobalTabsOrderItem = z.infer<typeof GlobalTabsOrderItem>;

export const DashboardSettings = z.object({
  user_id: Uuid.nullable(),
  widget_order: z.array(z.string()),
  widget_visibility: z.record(z.string(), z.boolean()),
  widget_sizes: RglLayouts,
  locked_fields: z.array(z.string()),
  default_date_range: DateRangePreset,
  heatmap_default_x_axis: HeatmapXAxis,
  globaltabs_order: z.array(GlobalTabsOrderItem).nullable(),
  updated_at: Iso,
});
export type DashboardSettings = z.infer<typeof DashboardSettings>;
