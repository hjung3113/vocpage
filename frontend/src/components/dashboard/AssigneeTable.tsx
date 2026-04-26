import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAssigneeStats } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { buildNav } from '../../utils/dashboardNav';
import './AssigneeTable.css';

export interface AssigneeTableProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

function cellAlpha(value: number, maxValue: number): string {
  if (value === 0 || maxValue === 0) return '';
  const alpha = 0.06 + (value / maxValue) * (0.62 - 0.06);
  return `oklch(63% 0.19 258 / ${alpha.toFixed(2)})`;
}

type XAxis = 'status' | 'priority' | 'tag';

export function AssigneeTable({ filter, buildQueryParams }: AssigneeTableProps) {
  const navigate = useNavigate();
  const [xAxis, setXAxis] = useState<XAxis>('status');
  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data } = useQuery({
    queryKey: ['dashboard-assignee-stats', xAxis, params],
    queryFn: () => getAssigneeStats({ ...params, xAxis }),
    staleTime: 5 * 60 * 1000,
  });

  const allValues = data?.rows.flatMap((row) => row.values ?? []) ?? [];
  const maxValue = Math.max(...allValues, 1);

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">담당자별 처리 현황</span>
        <div className="assign-btn-group">
          <button
            className={`assign-btn${xAxis === 'status' ? ' active' : ''}`}
            onClick={() => setXAxis('status')}
          >
            진행 현황
          </button>
          <button
            className={`assign-btn${xAxis === 'priority' ? ' active' : ''}`}
            onClick={() => setXAxis('priority')}
          >
            우선순위별
          </button>
          <button
            className={`assign-btn${xAxis === 'tag' ? ' active' : ''}`}
            onClick={() => setXAxis('tag')}
          >
            태그별
          </button>
        </div>
      </div>

      <table className="assign-table">
        <thead>
          <tr>
            <th className="rl">담당자</th>
            {(data?.headers ?? []).map((h) => (
              <th key={h}>{h}</th>
            ))}
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          {(data?.rows ?? []).map((row) => {
            const isActive = filter.activeAssignee === row.assigneeId;
            return (
              <tr key={row.assigneeId} className={isActive ? 'assign-row-highlight' : ''}>
                <td className={`rl${!row.assigneeName ? ' unassigned' : ''}`}>
                  {row.assigneeName || '미지정'}
                </td>
                {(row.values ?? []).map((val, idx) => {
                  const header = data?.headers[idx] ?? '';
                  if (val === 0) {
                    return (
                      <td
                        key={idx}
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
                      key={idx}
                      style={{ background: cellAlpha(val, maxValue), cursor: 'pointer' }}
                      onClick={() =>
                        navigate(
                          buildNav(params, {
                            assigneeId: row.assigneeId || 'unassigned',
                            [xAxis === 'status'
                              ? 'status'
                              : xAxis === 'priority'
                                ? 'priority'
                                : 'tag']: header,
                          }),
                        )
                      }
                    >
                      {val}
                    </td>
                  );
                })}
                <td className="tc">{row.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
