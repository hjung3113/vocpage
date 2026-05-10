/**
 * MSW handlers for /api/dashboard/* — Wave 2 Phase B (KPI summary) +
 * Phase D (RGL settings). Lets `VITE_USE_MSW=true` dev/demo render the
 * dashboard end-to-end without a live backend.
 */
import { http, HttpResponse } from 'msw';
import type { DashboardSettings, DashboardSummary } from '@contracts/dashboard';

const ADMIN_DEFAULT_SETTINGS: DashboardSettings = {
  user_id: null,
  widget_order: [
    'kpi-volume',
    'kpi-quality',
    'sla-aging',
    'assignee',
    'dist-matrix',
    'trend-tag',
    'heatmap',
    'aging-top10',
  ],
  widget_visibility: {},
  widget_sizes: {},
  locked_fields: [],
  default_date_range: '1m',
  custom_start_date: null,
  custom_end_date: null,
  heatmap_default_x_axis: 'status',
  globaltabs_order: null,
  updated_at: new Date().toISOString(),
};

let currentSettings: DashboardSettings = { ...ADMIN_DEFAULT_SETTINGS };
let currentAdminSettings: DashboardSettings = { ...ADMIN_DEFAULT_SETTINGS };

const DEMO_SUMMARY: DashboardSummary = {
  kpi_volume: {
    total_voc: { value: 2_847, delta: 12, delta_kind: 'percent' },
    unresolved: { value: 184, delta: -7, delta_kind: 'percent' },
    this_week_new: { value: 38, delta: 4, delta_kind: 'count' },
    this_week_completed: { value: 41, delta: 6, delta_kind: 'count' },
  },
  kpi_quality: {
    avg_resolution_days: { value: 3.6, delta: -0.4, delta_kind: 'days' },
    resolution_rate: { value: 0.93, delta: 1.2, delta_kind: 'percentage_point' },
    urgent_high_unresolved: { value: 7, delta: 2, delta_kind: 'count' },
    overdue_14d: { value: 3, delta: 1, delta_kind: 'count' },
  },
};

export const dashboardHandlers = [
  http.get('/api/dashboard/settings', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('scope') === 'admin') {
      return HttpResponse.json(currentAdminSettings);
    }
    return HttpResponse.json(currentSettings);
  }),

  http.put('/api/dashboard/settings', async ({ request }) => {
    const url = new URL(request.url);
    const adminScope = url.searchParams.get('scope') === 'admin';
    const patch = (await request.json().catch(() => ({}))) as Partial<DashboardSettings>;
    // ADR 0006 §7: Admin 행은 'custom' 차단.
    if (adminScope && patch.default_date_range === 'custom') {
      return HttpResponse.json(
        { code: 'ADMIN_CUSTOM_NOT_SUPPORTED', message: "Admin 기본값은 'custom' 미지원." },
        { status: 415 },
      );
    }
    if (adminScope) {
      currentAdminSettings = {
        ...currentAdminSettings,
        ...patch,
        user_id: null,
        updated_at: new Date().toISOString(),
      };
      return HttpResponse.json(currentAdminSettings);
    }
    currentSettings = {
      ...currentSettings,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(currentSettings);
  }),

  http.get('/api/dashboard/summary', () => HttpResponse.json(DEMO_SUMMARY)),
];
