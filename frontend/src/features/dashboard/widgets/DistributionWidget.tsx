/**
 * DistributionWidget — Wave 2 Phase C (dashboard.md §2 분포 탭).
 * widgetId: dist-matrix (shared slot — see DashboardShell).
 * Donut chart (recharts PieChart) + legend for status/priority/voc_type/tag.
 * P0-2: Legend item click → /voc?<param>=<val>&...globalFilter.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@shared/ui/skeleton';
import type { DistributionType } from '@contracts/dashboard';
import { useDistribution } from '../model/useDistribution';
import { useDashboardFilter } from '../model/dashboardFilter';
import { buildVocUrl } from './buildVocUrl';

const TABS: { id: DistributionType; label: string }[] = [
  { id: 'status', label: '상태' },
  { id: 'priority', label: '우선순위' },
  { id: 'voc_type', label: '유형' },
  { id: 'tag', label: '태그' },
];

/** Mapping from DistributionType to /voc search param key */
const TAB_PARAM: Record<DistributionType, string> = {
  status: 'status',
  priority: 'priority',
  voc_type: 'vocType',
  tag: 'tag',
};

/** Status / priority color tokens — CSS vars only. */
const SLICE_COLORS: Record<string, string | undefined> = {
  접수: 'var(--status-received)',
  검토중: 'var(--status-review)',
  처리중: 'var(--status-processing)',
  완료: 'var(--status-done)',
  드랍: 'var(--status-drop)',
  urgent: 'var(--priority-urgent)',
  high: 'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low: 'var(--priority-low)',
};
const DEFAULT_COLORS = [
  'var(--chart-blue)',
  'var(--chart-emerald)',
  'var(--chart-amber)',
  'var(--chart-red)',
  'var(--chart-purple)',
  'var(--chart-teal)',
  'var(--text-quaternary)',
];

function sliceColor(key: string, index: number): string {
  return SLICE_COLORS[key] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? 'var(--text-quaternary)';
}

export function DistributionWidget() {
  const [activeTab, setActiveTab] = useState<DistributionType>('status');
  const { data, isLoading, isError, refetch } = useDistribution(activeTab);
  const { filter } = useDashboardFilter();
  const navigate = useNavigate();

  function handleLegendClick(entry: { value?: string }) {
    if (!entry.value) return;
    const paramKey = TAB_PARAM[activeTab];
    navigate(buildVocUrl({ [paramKey]: entry.value }, filter));
  }

  return (
    <div
      data-testid="widget-distribution"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
          분포
        </div>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--brand)] text-[var(--text-on-brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-2" data-testid="distribution-loading">
          <Skeleton className="flex-1" />
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]">
          <span>데이터를 불러오지 못했습니다</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-xs hover:bg-[var(--bg-elevated)]"
          >
            다시 시도
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-quaternary)]">
          데이터 없음
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="flex flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.items}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
              >
                {data.items.map((item, i) => (
                  <Cell key={item.key} fill={sliceColor(item.key, i)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value, '건']}
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                onClick={handleLegendClick}
                wrapperStyle={{ cursor: 'pointer' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
