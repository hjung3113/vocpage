/**
 * HeatmapWidget — Wave 2 Phase C (dashboard.md §4 드릴다운 히트맵 v3).
 * Colored grid table. xAxis state is LOCAL (independent from assignee stats).
 * Reuses GridTable for intensity shading.
 * P1-2: Breadcrumb left of title. P0-2: Click-through nav to /voc.
 */
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@shared/ui/skeleton';
import type { HeatmapXAxis } from '@contracts/dashboard';
import { useHeatmap } from '../model/useHeatmap';
import { useDashboardFilter } from '../model/dashboardFilter';
import { GridTable, type GridTableRow } from './GridTable';
import { buildVocUrl } from './buildVocUrl';

const X_AXIS_OPTIONS: { id: HeatmapXAxis; label: string }[] = [
  { id: 'status', label: '상태' },
  { id: 'priority', label: '우선순위' },
  { id: 'tag', label: '태그' },
];

export function HeatmapWidget() {
  const navigate = useNavigate();
  const { filter, systemName, setSystemName, menuName, setMenuName, patch } = useDashboardFilter();
  const { data, isLoading, isError, refetch, xAxis, setXAxis } = useHeatmap();

  const rows: GridTableRow[] = data?.rows.map((r) => ({
    id: r.id,
    name: r.name,
    values: r.values,
    total: r.total,
    isClickable: r.level === 'system',
  })) ?? [];

  /** Determine breadcrumb tier based on current filter */
  const hasSystem = !!filter.systemId;
  const hasMenu = !!filter.menuId;

  function handleCellClick(rowId: string | null, colIndex: number) {
    if (rowId === null) return;
    const colKey = data?.headers[colIndex];
    if (!colKey) return;
    // xAxis determines what the column key represents
    const widgetParams: Record<string, string> = {};
    if (xAxis === 'status') widgetParams.status = colKey;
    else if (xAxis === 'priority') widgetParams.priority = colKey;
    else if (xAxis === 'tag') widgetParams.tag = colKey;
    // Row key is system or menu id
    if (hasSystem) widgetParams.menuId = rowId;
    else widgetParams.systemId = rowId;
    navigate(buildVocUrl(widgetParams, filter));
  }

  function handleRowClick(rowId: string | null) {
    if (!rowId) return;
    const row = data?.rows.find((r) => r.id === rowId);
    if (!row) return;
    // Drill down: system row → set systemId; menu row → set menuId
    if (!hasSystem) {
      patch({ systemId: rowId });
      setSystemName(row.name);
      setMenuName(undefined);
    }
  }

  return (
    <div
      data-testid="widget-heatmap"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        {/* Breadcrumb + title */}
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.07em]">
          {/* 전체 tier */}
          {!hasSystem && (
            <span className="text-[var(--text-quaternary)]" data-testid="heatmap-breadcrumb-root">전체</span>
          )}
          {/* 시스템 tier */}
          {hasSystem && !hasMenu && (
            <>
              <button
                type="button"
                data-testid="heatmap-breadcrumb-all"
                className="text-[var(--text-quaternary)] hover:text-[var(--brand)] transition-colors"
                onClick={() => {
                  patch({ systemId: undefined, menuId: undefined });
                  setSystemName(undefined);
                  setMenuName(undefined);
                }}
              >
                전체
              </button>
              <span className="text-[var(--text-quaternary)]">›</span>
              <span className="text-[var(--text-secondary)]" data-testid="heatmap-breadcrumb-system">{systemName ?? '시스템'}</span>
            </>
          )}
          {/* 메뉴 tier */}
          {hasSystem && hasMenu && (
            <>
              <button
                type="button"
                data-testid="heatmap-breadcrumb-all"
                className="text-[var(--text-quaternary)] hover:text-[var(--brand)] transition-colors"
                onClick={() => {
                  patch({ systemId: undefined, menuId: undefined });
                  setSystemName(undefined);
                  setMenuName(undefined);
                }}
              >
                전체
              </button>
              <span className="text-[var(--text-quaternary)]">›</span>
              <button
                type="button"
                data-testid="heatmap-breadcrumb-system"
                className="text-[var(--text-quaternary)] hover:text-[var(--brand)] transition-colors"
                onClick={() => {
                  patch({ menuId: undefined });
                  setMenuName(undefined);
                }}
              >
                {systemName ?? '시스템'}
              </button>
              <span className="text-[var(--text-quaternary)]">›</span>
              <span className="text-[var(--text-secondary)]" data-testid="heatmap-breadcrumb-menu">{menuName ?? '메뉴'}</span>
            </>
          )}
          <span className="ml-1 text-[var(--text-quaternary)]">히트맵</span>
        </div>
        <div className="flex gap-1">
          {X_AXIS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setXAxis(opt.id)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                xAxis === opt.id
                  ? 'bg-[var(--brand)] text-[var(--text-on-brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-2" data-testid="heatmap-loading">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-8" />)}
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

      {data && rows.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-quaternary)]">
          해당 기간 데이터 없음
        </div>
      )}

      {data && (rows.length > 0 || data.totalRow) && (
        <div className="flex-1 min-h-0 overflow-auto">
          <GridTable
            headers={data.headers}
            rows={rows}
            maxValue={data.max_value}
            totalRow={data.totalRow}
            onCellClick={handleCellClick}
            onRowClick={handleRowClick}
          />
        </div>
      )}
    </div>
  );
}
