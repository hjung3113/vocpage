/**
 * @module shared/contracts/dashboard/io
 *
 * Dashboard settings API contract — Wave 2 Phase A (W2-3 / PR-γ).
 *
 * Spec lock:
 *  - docs/specs/requires/dashboard.md §커스터마이즈 v2 (RGL 12-col grid,
 *    breakpoint-keyed widget_sizes v2, 2-tier 잠금 머지 규칙).
 *  - docs/specs/plans/wave-2-dashboard.md §3 W2-D2/D3, §6.2 W2-3.
 *
 * HTTP verb: PUT /api/dashboard/settings (PATCH 아님 — codex:rescue 리뷰
 * 2026-05-10 §1 verb mismatch 정합).
 */
import { z } from 'zod';
import { Uuid } from '../common';

// ──────────────────────────────────────────────────────────────────────────
// Widget IDs — dashboard.md §위젯 상세 명세 §1~§11 의 stable string IDs.
// 신규 위젯 추가 시 본 union 에 append (irreversible — fixture / locked_widgets
// JSONB / defaultLayouts 가 동시 의존).
// ──────────────────────────────────────────────────────────────────────────
export const WidgetId = z.enum([
  'kpi',
  'distribution',
  'priority-status-matrix',
  'heatmap',
  'weekly-trend',
  'tag-bar',
  'system-card',
  'assignee-table',
  'aging-top10',
  'sla',
  'aging',
]);
export type WidgetId = z.infer<typeof WidgetId>;

// ──────────────────────────────────────────────────────────────────────────
// Widget layout — RGL `Layout` 호환 + 12-col bounds.
// codex:rescue 리뷰 §2 zod gotcha 반영: x/y/w/h 정수 + bounds + x+w<=12 검증.
// ──────────────────────────────────────────────────────────────────────────
export const WidgetLayout = z
  .object({
    x: z.number().int().min(0).max(11),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1),
    static: z.boolean().optional(),
  })
  .refine(({ x, w }) => x + w <= 12, {
    message: 'x + w must be ≤ 12 (12-col grid bound)',
  });
export type WidgetLayout = z.infer<typeof WidgetLayout>;

// ──────────────────────────────────────────────────────────────────────────
// widget_sizes v2 — breakpoint-keyed. v1 (flat) 데이터 부재 (Wave 2 미출시)
// → in-app 마이그 불필요. xs 는 RGL 자동 1-col stack — 직렬화 X.
// ──────────────────────────────────────────────────────────────────────────
// zod v4 의 z.record(EnumKey, V) 는 모든 enum 키를 강제 — 본 컬럼은 partial
// map 이므로 z.string() 키 + 별도 refinement 으로 widget ID 도메인 검증.
export const WidgetSizesV2 = z
  .record(
    z.string(),
    z.object({
      lg: WidgetLayout,
      md: WidgetLayout.optional(),
      sm: WidgetLayout.optional(),
    }),
  )
  .refine(
    (val) => Object.keys(val).every((k) => WidgetId.safeParse(k).success),
    { message: 'unknown widget id in widget_sizes' },
  );
export type WidgetSizesV2 = z.infer<typeof WidgetSizesV2>;

// ──────────────────────────────────────────────────────────────────────────
// Widget visibility — 개인 잠금 (`locked: true`) + 가시성 토글.
// 머지 규칙: static = adminLockedWidgets.includes(id) || visibility[id]?.locked.
// ──────────────────────────────────────────────────────────────────────────
export const WidgetVisibility = z
  .record(
    z.string(),
    z.object({
      visible: z.boolean().default(true),
      locked: z.boolean().optional(),
    }),
  )
  .refine(
    (val) => Object.keys(val).every((k) => WidgetId.safeParse(k).success),
    { message: 'unknown widget id in widget_visibility' },
  );
export type WidgetVisibility = z.infer<typeof WidgetVisibility>;

// ──────────────────────────────────────────────────────────────────────────
// Date range / heatmap X-axis enums — dashboard.md preamble + §히트맵.
// ──────────────────────────────────────────────────────────────────────────
export const DefaultDateRange = z.enum(['1m', '3m', '1y', 'all', 'custom']);
export type DefaultDateRange = z.infer<typeof DefaultDateRange>;

export const HeatmapXAxis = z.enum(['status', 'priority', 'tag']);
export type HeatmapXAxis = z.infer<typeof HeatmapXAxis>;

// ──────────────────────────────────────────────────────────────────────────
// GlobalTabs order — Admin 행에서만 의미 있음. systemId + visible 페어.
// ──────────────────────────────────────────────────────────────────────────
export const GlobalTabEntry = z.object({
  systemId: Uuid,
  visible: z.boolean(),
});
export type GlobalTabEntry = z.infer<typeof GlobalTabEntry>;

// ──────────────────────────────────────────────────────────────────────────
// DashboardSettings — GET / PUT response & body shape.
// `locked_widgets` 는 Admin tier (`user_id IS NULL`) SSOT — migration 022.
// ──────────────────────────────────────────────────────────────────────────
export const DashboardSettings = z.object({
  widget_order: z.array(WidgetId),
  widget_visibility: WidgetVisibility,
  widget_sizes: WidgetSizesV2,
  locked_widgets: z.array(WidgetId),
  default_date_range: DefaultDateRange,
  heatmap_default_x_axis: HeatmapXAxis,
  globaltabs_order: z.array(GlobalTabEntry).nullable(),
});
export type DashboardSettings = z.infer<typeof DashboardSettings>;

// PUT body: 부분 업데이트 허용 (zod partial). 서버는 row 머지 후 PUT 의미론
// 으로 전체 저장. 빈 키는 서버 기존값 유지.
export const DashboardSettingsPutBody = DashboardSettings.partial();
export type DashboardSettingsPutBody = z.infer<typeof DashboardSettingsPutBody>;

export const DashboardSettingsResponse = DashboardSettings;
export type DashboardSettingsResponse = DashboardSettings;
