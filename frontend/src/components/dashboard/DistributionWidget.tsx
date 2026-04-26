import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDistribution } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { DimSelector } from './DimSelector';
import { buildNav } from '../../utils/dashboardNav';
import './DistributionWidget.css';

export interface DistributionWidgetProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

type TabType = 'status' | 'priority' | 'voc_type' | 'tag';

const STATUS_COLORS = [
  'var(--text-quaternary)',
  'oklch(67% .17 240)',
  'oklch(55% .17 150)',
  'var(--status-emerald)',
  'oklch(70% .16 72)',
];
const PRIORITY_COLORS = [
  'var(--status-red)',
  'oklch(60% .18 45)',
  'var(--text-tertiary)',
  'var(--text-quaternary)',
];
const TAG_COLORS = [
  'var(--chart-blue)',
  'var(--chart-sky)',
  'var(--chart-red)',
  'var(--chart-amber)',
  'var(--chart-emerald)',
  'var(--text-tertiary)',
];

function getColor(tab: TabType, index: number, itemColor?: string): string {
  if (tab === 'voc_type' && itemColor) return itemColor;
  if (tab === 'status') return STATUS_COLORS[index % STATUS_COLORS.length];
  if (tab === 'priority') return PRIORITY_COLORS[index % PRIORITY_COLORS.length];
  return TAG_COLORS[index % TAG_COLORS.length];
}

function buildConicGradient(items: { color: string; pct: number }[]): string {
  if (items.length === 0) return 'conic-gradient(var(--bg-elevated) 0% 100%)';
  let acc = 0;
  return (
    'conic-gradient(' +
    items
      .map((item, i) => {
        const pct = item.pct ?? 0;
        const start = acc;
        acc += pct;
        const end = i === items.length - 1 ? 100 : acc;
        return `${item.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
      })
      .join(', ') +
    ')'
  );
}

const TABS: { value: TabType; label: string }[] = [
  { value: 'status', label: '상태' },
  { value: 'priority', label: '우선순위' },
  { value: 'voc_type', label: '유형' },
  { value: 'tag', label: '태그' },
];

export function DistributionWidget({ filter, buildQueryParams }: DistributionWidgetProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [dim, setDim] = useState<'all' | 'system' | 'menu'>('all');

  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data = [] } = useQuery({
    queryKey: ['dashboard-dist', activeTab, dim, params],
    queryFn: () => getDistribution({ ...params, type: activeTab }),
    staleTime: 5 * 60 * 1000,
  });

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const coloredData = data.map((item, i) => ({
    ...item,
    resolvedColor: getColor(activeTab, i, item.color),
  }));

  const conicBg =
    coloredData.length > 0
      ? buildConicGradient(coloredData.map((d) => ({ color: d.resolvedColor, pct: d.pct })))
      : 'var(--bg-elevated)';

  function handleLegendClick(item: (typeof data)[0]) {
    if (activeTab === 'status') {
      navigate(buildNav(params, { status: item.name }));
    } else if (activeTab === 'priority') {
      navigate(buildNav(params, { priority: item.name }));
    } else if (activeTab === 'voc_type') {
      navigate(buildNav(params, { vocType: item.name }));
    } else {
      navigate(buildNav(params, { tag: item.name }));
    }
  }

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">분포</span>
        <DimSelector
          options={[
            { label: '전체', value: 'all' },
            { label: '시스템별', value: 'system' },
            { label: '메뉴별', value: 'menu' },
          ]}
          value={dim}
          onChange={(v) => setDim(v as 'all' | 'system' | 'menu')}
          hiddenValues={filter.globalTab !== 'all' ? ['system'] : []}
        />
      </div>

      <div className="d-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            className={`d-tab${activeTab === tab.value ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="donut-section">
        <div className="donut-wrap" style={{ background: conicBg }}>
          <div className="donut-hole">
            <span className="donut-total">{total}</span>
            <span className="donut-label">총건수</span>
          </div>
        </div>

        <div className="donut-legend">
          {coloredData.map((item) => (
            <div key={item.name} className="legend-item" onClick={() => handleLegendClick(item)}>
              <span className="legend-dot" style={{ background: item.resolvedColor }} />
              <span className="legend-name">{item.name}</span>
              <span className="legend-count">{item.count}</span>
              <span className="legend-pct">{(item.pct ?? 0).toFixed(0)}%</span>
              <span className="legend-bar-wrap">
                <span
                  className="legend-bar-fill"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    background: item.resolvedColor,
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
