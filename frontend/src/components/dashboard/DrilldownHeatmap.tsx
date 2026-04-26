import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getHeatmap } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { buildNav } from '../../utils/dashboardNav';
import './DrilldownHeatmap.css';

export interface DrilldownHeatmapProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
  onSwitchTab: (tabId: string) => void;
  systemName?: string;
  menuName?: string;
}

function heatmapAlpha(value: number, maxValue: number): string {
  if (value === 0 || maxValue === 0) return '';
  const alpha = 0.06 + (value / maxValue) * (0.62 - 0.06);
  return `oklch(63% 0.19 258 / ${alpha.toFixed(2)})`;
}

type XAxis = 'status' | 'priority' | 'tag';

export function DrilldownHeatmap({
  filter,
  buildQueryParams,
  onSwitchTab,
  systemName,
  menuName,
}: DrilldownHeatmapProps) {
  const navigate = useNavigate();
  const [xAxis, setXAxis] = useState<XAxis>('status');

  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data } = useQuery({
    queryKey: ['dashboard-heatmap', xAxis, params],
    queryFn: () => getHeatmap({ ...params, xAxis }),
    staleTime: 5 * 60 * 1000,
  });

  const viewMaxValue = useMemo(() => {
    if (!data) return 0;
    let max = 0;
    for (const row of data.rows) {
      for (const v of row.values) {
        if (v > max) max = v;
      }
    }
    return max;
  }, [data]);

  function onDataCellClick(header: string, systemId: string | null, menuId: string | null) {
    const extra: Record<string, string | undefined> = {};
    if (xAxis === 'status') extra.status = header;
    else if (xAxis === 'priority') extra.priority = header;
    else extra.tag = header;
    if (systemId) extra.systemId = systemId;
    if (menuId) extra.menuId = menuId;
    navigate(buildNav(params, extra));
  }

  const grandTotal = data ? data.rows.reduce((s, r) => s + r.total, 0) : 0;

  const isAllTab = filter.globalTab === 'all';

  return (
    <div
      className="widget"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '14px 16px',
      }}
    >
      <div className="heatmap-top">
        <div className="heatmap-top-left">
          <span className="heatmap-title">드릴다운 히트맵</span>
          <nav className="hm-breadcrumb" aria-label="breadcrumb">
            {isAllTab ? (
              <span className="hm-crumb">전체</span>
            ) : (
              <>
                <span className="hm-crumb clickable" onClick={() => onSwitchTab('all')}>
                  전체
                </span>
                {systemName && (
                  <>
                    <span className="hm-sep">›</span>
                    {filter.activeMenu ? (
                      <span
                        className="hm-crumb clickable"
                        onClick={() => onSwitchTab(filter.globalTab)}
                      >
                        {systemName}
                      </span>
                    ) : (
                      <span className="hm-crumb">{systemName}</span>
                    )}
                  </>
                )}
                {filter.activeMenu && menuName && (
                  <>
                    <span className="hm-sep">›</span>
                    <span className="hm-crumb">{menuName}</span>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
        <div className="hm-btn-group">
          <button
            className={`hm-btn${xAxis === 'status' ? ' active' : ''}`}
            onClick={() => setXAxis('status')}
          >
            진행 현황
          </button>
          <button
            className={`hm-btn${xAxis === 'priority' ? ' active' : ''}`}
            onClick={() => setXAxis('priority')}
          >
            우선순위별
          </button>
          <button
            className={`hm-btn${xAxis === 'tag' ? ' active' : ''}`}
            onClick={() => setXAxis('tag')}
          >
            태그별
          </button>
        </div>
      </div>

      <table className="heatmap-table">
        <colgroup>
          <col style={{ width: 130 }} />
          {(data?.headers ?? []).map((_, i) => (
            <col key={i} />
          ))}
          <col style={{ width: 60 }} />
        </colgroup>
        <thead>
          <tr>
            <th className="rl"></th>
            {(data?.headers ?? []).map((h) => (
              <th key={h}>{h}</th>
            ))}
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          {data ? (
            <>
              <tr className="hm-total-row">
                <td className="rl">합계</td>
                {data.totalRow.map((v, i) => (
                  <td
                    key={i}
                    className="tc"
                    style={
                      v > 0 ? { background: heatmapAlpha(v, viewMaxValue), cursor: 'pointer' } : {}
                    }
                    onClick={v > 0 ? () => onDataCellClick(data.headers[i], null, null) : undefined}
                  >
                    {v || '—'}
                  </td>
                ))}
                <td className="tc">{grandTotal}</td>
              </tr>
              {data.rows.map((row) => (
                <tr key={row.id}>
                  <td
                    className={`rl${isAllTab ? ' clickable' : ''}`}
                    onClick={isAllTab ? () => onSwitchTab(row.id) : undefined}
                    title={row.name}
                  >
                    {isAllTab ? '▶ ' : ''}
                    {row.name}
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={v === 0 ? 'empty' : ''}
                      style={
                        v > 0
                          ? { background: heatmapAlpha(v, viewMaxValue), cursor: 'pointer' }
                          : {}
                      }
                      onClick={
                        v > 0
                          ? () =>
                              onDataCellClick(
                                data.headers[i],
                                isAllTab ? row.id : null,
                                !isAllTab ? row.id : null,
                              )
                          : undefined
                      }
                    >
                      {v || '—'}
                    </td>
                  ))}
                  <td className="tc">{row.total}</td>
                </tr>
              ))}
            </>
          ) : (
            <tr>
              <td className="rl">—</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
