import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProcessingSpeed } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { DimSelector } from './DimSelector';
import './ProcessingSpeedWidget.css';

export interface ProcessingSpeedWidgetProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

function slaRateClass(rate: number): string {
  if (rate >= 80) return 'sla-rate sla-good';
  if (rate >= 60) return 'sla-rate sla-warn';
  return 'sla-rate sla-bad';
}

export function ProcessingSpeedWidget({ filter, buildQueryParams }: ProcessingSpeedWidgetProps) {
  const [dim, setDim] = useState<'all' | 'system' | 'menu'>('all');
  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data } = useQuery({
    queryKey: ['dashboard-processing-speed', dim, params],
    queryFn: () => getProcessingSpeed(params),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">처리 속도 &amp; SLA</span>
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

      <div className="sla-header">
        <span>항목</span>
        <span style={{ textAlign: 'right' }}>평균 일수</span>
        <span style={{ textAlign: 'right' }}>SLA 달성</span>
      </div>

      {(data?.rows ?? []).map((row) => (
        <div className="sla-row" key={row.id}>
          <span className="sla-name">{row.name}</span>
          <span className="sla-avg">{(row.avgDays ?? 0).toFixed(1)}일</span>
          <span className={slaRateClass(row.slaRate)}>{row.slaRate}%</span>
        </div>
      ))}

      {(data?.rows ?? []).length === 0 && <p className="sla-empty">데이터 없음</p>}
    </div>
  );
}
