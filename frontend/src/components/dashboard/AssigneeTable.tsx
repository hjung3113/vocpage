import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAssigneeStats, type DashboardFilters } from '../../api/dashboard';

type XAxis = 'status' | 'priority' | 'tag';

const AXIS_OPTIONS: { key: XAxis; label: string }[] = [
  { key: 'status', label: '진행현황' },
  { key: 'priority', label: '우선순위별' },
  { key: 'tag', label: '태그별' },
];

interface Props {
  apiFilters: DashboardFilters;
}

export function AssigneeTable({ apiFilters }: Props) {
  const [xAxis, setXAxis] = useState<XAxis>('status');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'assignee-stats', xAxis, apiFilters],
    queryFn: () => fetchAssigneeStats(apiFilters, xAxis),
  });

  const xValues = data?.x_values ?? [];
  const assigneeNames = [...new Set(data?.rows.map((r) => r.assignee_name) ?? [])];
  const cellMap = new Map<string, number>();
  data?.rows.forEach((r) => cellMap.set(`${r.assignee_name}|${r.x_label}`, r.count));

  const cellStyle: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'center',
    fontSize: '13px',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    color: 'var(--text-muted)',
    fontWeight: 600,
    background: 'var(--bg-surface)',
  };

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          담당자별 통계
        </h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {AXIS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setXAxis(opt.key)}
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: xAxis === opt.key ? 'var(--brand)' : 'transparent',
                color: xAxis === opt.key ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p style={{ color: 'var(--text-muted)' }}>로딩 중...</p>}
      {isError && <p style={{ color: 'var(--danger)' }}>데이터를 불러오지 못했습니다.</p>}

      {data && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, textAlign: 'left', position: 'sticky', left: 0 }}>
                  담당자
                </th>
                {xValues.map((x) => (
                  <th key={x} style={headerStyle}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assigneeNames.map((name) => (
                <tr key={name}>
                  <td
                    style={{
                      ...cellStyle,
                      textAlign: 'left',
                      background: 'var(--bg-surface)',
                      position: 'sticky',
                      left: 0,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {name}
                  </td>
                  {xValues.map((x) => (
                    <td key={x} style={cellStyle}>
                      {cellMap.get(`${name}|${x}`) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
