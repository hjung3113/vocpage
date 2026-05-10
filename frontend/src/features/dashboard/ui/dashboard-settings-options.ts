/**
 * dashboard-settings-options.ts — Wave 2 Phase E
 * Static option lists + labels consumed by DashboardSettingsDialog.
 */
import type { DateRangePreset, HeatmapXAxis } from '@contracts/dashboard';
import type { WidgetId } from '../defaultLayouts';

export const WIDGET_LABELS: Record<WidgetId, string> = {
  'kpi-volume': 'KPI 볼륨',
  'kpi-quality': 'KPI 품질',
  'dist-matrix': '분포 / 우선순위 매트릭스',
  heatmap: '드릴다운 히트맵',
  'trend-tag': '주간 트렌드',
  'sla-aging': '처리속도 (SLA)',
  assignee: '담당자별 처리 현황',
  'aging-top10': '장기 미처리 Top 10',
};

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '1y', label: '1년' },
  { value: 'all', label: '전체' },
  { value: 'custom', label: '사용자 지정' },
];

export const X_AXIS_OPTIONS: { value: HeatmapXAxis; label: string }[] = [
  { value: 'status', label: '상태' },
  { value: 'priority', label: '우선순위' },
  { value: 'tag', label: '태그' },
];
