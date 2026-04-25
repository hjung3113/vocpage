import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHeatmap, type DashboardFilters } from '../../api/dashboard';

type XAxis = 'status' | 'priority' | 'tag';

const AXIS_OPTIONS: { key: XAxis; label: string }[] = [
  { key: 'status', label: '진행현황' },
  { key: 'priority', label: '우선순위별' },
  { key: 'tag', label: '태그별' },
];

interface Props {
  apiFilters: DashboardFilters;
}

export function DrilldownHeatmap({ apiFilters }: Props) {
  const [xAxis, setXAxis] = useState<XAxis>('status');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'heatmap', xAxis, apiFilters],
    queryFn: () => fetchHeatmap(apiFilters, xAxis),
  });

  const maxCount = data?.rows.reduce((m, r) => Math.max(m, r.count), 0) ?? 1;

  // Build y_labels in order
  const yLabels = [...new Set(data?.rows.map((r) => r.y_label) ?? [])];
  const xValues = data?.x_values ?? [];

  function getCellBg(count: number): string {
    if (count === 0 || maxCount === 0) return 'transparent';
    const pct = Math.round((count / maxCount) * 80);
    return `color-mix(in oklch, var(--brand) ${pct}%, transparent)`;
  }

  const cellStyle: React.CSSProperties = {
    padding: '6px 10px',
    textAlign: 'center',
    fontSize: '12px',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    color: 'var(--text-muted)',
    fontWeight: 600,
    background: 'var(--bg-surface)',
    position: 'sticky',
    top: 0,
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
          드릴다운 히트맵
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
                  메뉴
                </th>
                {xValues.map((x) => (
                  <th key={x} style={headerStyle}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yLabels.map((y) => (
                <tr key={y}>
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
                    {y}
                  </td>
                  {xValues.map((x) => {
                    const row = data.rows.find((r) => r.y_label === y && r.x_label === x);
                    const count = row?.count ?? 0;
                    return (
                      <td key={x} style={{ ...cellStyle, background: getCellBg(count) }}>
                        {count > 0 ? count : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
