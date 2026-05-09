/**
 * Dashboard fixtures stub — Wave 2 W2-3 / PR-γ.
 *
 * Spec: docs/specs/requires/dashboard.md §커스터마이즈 v2.
 * Plan: docs/specs/plans/wave-2-dashboard.md §6.2 W2-3.
 *
 * Phase A 범위: settings GET / PUT 의 default + Admin 시드 fixture 만.
 * 위젯별 데이터 fixture (KPI / 분포 / 매트릭스 / 히트맵 등) → Phase B/C 별 PR.
 *
 * Parity: scripts/check-fixture-seed-parity.ts 가 BE seed (`backend/seeds/`)
 * 와 본 파일 형상을 비교 — Phase A 시드 시점에 동기화.
 */
import type {
  DashboardSettings,
  WidgetId,
  WidgetSizesV2,
} from '../contracts/dashboard';

// 11 위젯 stable ID 목록 — defaultLayouts 와 fixture 양쪽 SSOT.
export const WIDGET_IDS: readonly WidgetId[] = [
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
] as const;

// Default lg breakpoint layout — Phase D / W2-5 에서 frontend defaultLayouts.ts
// 가 정본화. 본 stub 은 fixture/seed parity 만을 위한 최소 형상.
export const DEFAULT_WIDGET_SIZES_LG: WidgetSizesV2 = {
  kpi: { lg: { x: 0, y: 0, w: 12, h: 2 } },
  distribution: { lg: { x: 0, y: 2, w: 6, h: 4 } },
  'priority-status-matrix': { lg: { x: 6, y: 2, w: 6, h: 4 } },
  heatmap: { lg: { x: 0, y: 6, w: 12, h: 6 } },
  'weekly-trend': { lg: { x: 0, y: 12, w: 6, h: 4 } },
  'tag-bar': { lg: { x: 6, y: 12, w: 6, h: 4 } },
  'system-card': { lg: { x: 0, y: 16, w: 12, h: 3 } },
  'assignee-table': { lg: { x: 0, y: 19, w: 12, h: 4 } },
  'aging-top10': { lg: { x: 0, y: 23, w: 12, h: 4 } },
  sla: { lg: { x: 0, y: 27, w: 6, h: 3 } },
  aging: { lg: { x: 6, y: 27, w: 6, h: 3 } },
};

// Default settings shape — Admin 행 (user_id IS NULL) 시드와 일치.
// `default_date_range: '1m'` 은 dashboard.md preamble + migration 011 정합.
export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  widget_order: [...WIDGET_IDS],
  widget_visibility: Object.fromEntries(WIDGET_IDS.map((id) => [id, { visible: true }])),
  widget_sizes: DEFAULT_WIDGET_SIZES_LG,
  locked_widgets: [],
  default_date_range: '1m',
  heatmap_default_x_axis: 'status',
  globaltabs_order: null,
};
