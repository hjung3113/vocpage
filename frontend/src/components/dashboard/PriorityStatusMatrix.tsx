import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPriorityStatusMatrix } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { DimSelector } from './DimSelector';
import './PriorityStatusMatrix.css';

export interface PriorityStatusMatrixProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'oklch(58% .22 25)',
  high: 'oklch(60% .18 45)',
  medium: 'var(--text-tertiary)',
  low: 'var(--text-quaternary)',
};

function cellAlpha(value: number, maxValue: number): string {
  if (value === 0 || maxValue === 0) return '';
  const alpha = 0.06 + (value / maxValue) * (0.62 - 0.06);
  return `oklch(63% 0.19 258 / ${alpha.toFixed(2)})`;
}

function buildNav(base: DashboardQueryParams, extra: Record<string, string | undefined>): string {
  const merged: Record<string, string | undefined> = {
    systemId: base.systemId,
    menuId: base.menuId,
    assigneeId: base.assigneeId,
    startDate: base.startDate,
    endDate: base.endDate,
    ...extra,
  };
  const entries = Object.entries(merged).filter(
    (e): e is [string, string] => e[1] !== undefined && e[1] !== '',
  );
  return '/?' + new URLSearchParams(entries).toString();
}

export function PriorityStatusMatrix({ filter, buildQueryParams }: PriorityStatusMatrixProps) {
  const navigate = useNavigate();
  const [dim, setDim] = useState<'all' | 'system' | 'menu'>('all');

  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data } = useQuery({
    queryKey: ['dashboard-matrix', dim, params],
    queryFn: () => getPriorityStatusMatrix(params),
    staleTime: 5 * 60 * 1000,
  });

  const allValues = data?.rows.flatMap((row) => Object.values(row.status)) ?? [];
  const maxValue = Math.max(...allValues, 1);

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">우선순위 × 상태 매트릭스</span>
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

      <table className="matrix-table">
        <thead>
          <tr>
            <th className="rh"></th>
            {(data?.statuses ?? []).map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data?.rows ?? []).map((row) => (
            <tr key={row.priority}>
              <td
                className="rh"
                style={{ color: PRIORITY_COLORS[row.priority] ?? 'var(--text-secondary)' }}
              >
                {row.priority}
              </td>
              {(data?.statuses ?? []).map((statusCol) => {
                const value = row.status[statusCol] ?? 0;
                const bg = cellAlpha(value, maxValue);
                if (value === 0) {
                  return (
                    <td
                      key={statusCol}
                      style={{
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-quaternary)',
                        cursor: 'default',
                      }}
                    >
                      —
                    </td>
                  );
                }
                return (
                  <td
                    key={statusCol}
                    style={{ background: bg }}
                    onClick={() =>
                      navigate(buildNav(params, { priority: row.priority, status: statusCol }))
                    }
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="matrix-footnote">셀 클릭 → 해당 필터로 VOC 목록 이동</p>
    </div>
  );
}
