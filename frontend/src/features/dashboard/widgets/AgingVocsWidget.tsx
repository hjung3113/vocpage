/**
 * AgingVocsWidget — Wave 2 Phase C (dashboard.md §9 장기 미처리 VOC Top 10 v3).
 * Data table. Elapsed days badge: 14–29 amber, 30+ red.
 * Date filter ignored (BE silently ignores).
 * P1-3: Dim toggle responsive to globalTab (systemId → 메뉴별; else → 시스템별).
 */
import { useState } from 'react';
import { Skeleton } from '@shared/ui/skeleton';
import type { AgingVocDim } from '@contracts/dashboard';

type AgingDimOption = { id: AgingVocDim; label: string };
import { useAgingVocs } from '../model/useAgingVocs';
import { useDashboardFilter } from '../model/dashboardFilter';

function elapsedBadgeStyle(days: number): string {
  if (days >= 30) return 'bg-[color-mix(in_oklch,var(--chart-red)_15%,transparent)] text-[var(--chart-red)]';
  if (days >= 14) return 'bg-[color-mix(in_oklch,var(--chart-amber)_15%,transparent)] text-[var(--chart-amber)]';
  return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]';
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export function AgingVocsWidget() {
  const { filter } = useDashboardFilter();
  const isSystemSelected = !!filter.systemId;
  // Dim options depend on global tab: no systemId → 전체/시스템별; systemId → 전체/메뉴별
  const dimOptions: AgingDimOption[] = isSystemSelected
    ? [{ id: 'all' as AgingVocDim, label: '전체' }, { id: 'menu' as AgingVocDim, label: '메뉴별' }]
    : [{ id: 'all' as AgingVocDim, label: '전체' }, { id: 'system' as AgingVocDim, label: '시스템별' }];

  const [dim, setDim] = useState<AgingVocDim>('all');
  const { data, isLoading, isError, refetch } = useAgingVocs(10, dim);

  // Column header for the system/menu column
  const groupColLabel = isSystemSelected ? '메뉴' : '시스템';

  return (
    <div
      data-testid="widget-aging-vocs"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
          장기 미처리 Top 10
        </div>
        <div className="flex gap-1">
          {dimOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              data-testid={`aging-dim-${opt.id}`}
              onClick={() => setDim(opt.id)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                dim === opt.id
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
        <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-2" data-testid="aging-loading">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9" />)}
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
          장기 미처리 VOC 없음
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-quaternary)]">
                <th className="py-2 text-left font-medium">이슈코드</th>
                <th className="py-2 text-left font-medium">제목</th>
                <th className="py-2 text-center font-medium">우선순위</th>
                <th className="py-2 text-left font-medium" data-testid="aging-group-col-header">{groupColLabel}</th>
                <th className="py-2 text-right font-medium w-16">경과일</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr
                  key={item.voc_id}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
                >
                  <td className="py-2 font-d2coding text-[var(--text-secondary)] whitespace-nowrap">
                    {item.issue_code}
                  </td>
                  <td className="py-2 text-[var(--text-primary)] max-w-[200px] truncate">
                    {item.title}
                  </td>
                  <td className="py-2 text-center">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      {PRIORITY_LABELS[item.priority] ?? item.priority}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--text-tertiary)] max-w-[120px] truncate">
                    {item.system_name ?? item.menu_name ?? '—'}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${elapsedBadgeStyle(item.elapsed_days)}`}>
                      {item.elapsed_days}일
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
