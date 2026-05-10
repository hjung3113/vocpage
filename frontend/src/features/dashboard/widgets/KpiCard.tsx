/**
 * KpiCard — Wave 2 Phase B (dashboard.md §1 KPI 카드).
 *
 * Single-metric card. The parent widget arranges 4 cards in a row and
 * supplies the section label (VOLUME / QUALITY).
 *
 * delta semantics:
 * - delta_kind=percent / count / days / percentage_point — UI formats accordingly.
 * - For `avg_resolution_days`, decrease is positive ("처리시간 ↓ = 좋음") so
 *   the parent passes `inverted=true` to flip the color treatment.
 * - `accent` adds the §1 강조 보더 (urgent/high → red, overdue → amber) when
 *   the metric is non-zero. Border tone is taken from the spec verbatim.
 */
import { cn } from '@shared/lib/cn';
import type { KpiMetric } from '@contracts/dashboard';

export type KpiAccent = 'none' | 'urgent' | 'overdue';

export interface KpiCardProps {
  label: string;
  metric: KpiMetric;
  /** Format applied to the value before rendering. Falls back per delta_kind. */
  formatValue?: (value: number) => string;
  /** Treat decrease as positive (used by 평균 처리시간). */
  inverted?: boolean;
  /** Spec-defined emphasis border. */
  accent?: KpiAccent;
  /** Sublabel shown beneath the value, e.g. "N일차" for week-fixed cards. */
  subLabel?: string;
  /** Optional click target — typically navigates to `/voc?...`. */
  onActivate?: () => void;
}

const DEFAULT_FORMATTERS: Record<KpiMetric['delta_kind'], (n: number) => string> = {
  percent: (n) => `${n.toFixed(0)}`,
  count: (n) => n.toLocaleString('ko-KR'),
  days: (n) => `${n.toFixed(1)}일`,
  percentage_point: (n) => `${n.toFixed(1)}%`,
};

function formatDelta(metric: KpiMetric): string | null {
  if (metric.delta === null) return null;
  const d = metric.delta;
  const sign = d > 0 ? '+' : d < 0 ? '−' : '';
  const abs = Math.abs(d);
  switch (metric.delta_kind) {
    case 'percent':
      return `${sign}${abs.toFixed(1)}%`;
    case 'percentage_point':
      return `${sign}${abs.toFixed(1)}%p`;
    case 'days':
      return `${sign}${abs.toFixed(1)}일`;
    case 'count':
      return `${sign}${abs.toLocaleString('ko-KR')}`;
  }
}

export function KpiCard({
  label,
  metric,
  formatValue,
  inverted = false,
  accent = 'none',
  subLabel,
  onActivate,
}: KpiCardProps) {
  const valueText = (formatValue ?? DEFAULT_FORMATTERS[metric.delta_kind])(metric.value);
  const deltaText = formatDelta(metric);
  // Direction colors: positive movement = chart-emerald (or red when inverted).
  const direction = metric.delta === null ? 0 : metric.delta > 0 ? 1 : metric.delta < 0 ? -1 : 0;
  const positive = inverted ? direction < 0 : direction > 0;
  const negative = inverted ? direction > 0 : direction < 0;

  // Spec §1 강조 보더 — urgent uses chart-red @ 35% alpha, overdue uses
  // chart-amber @ 30%. color-mix keeps the value derived from a token so
  // the no-raw-color lint stays satisfied.
  const accentBorder =
    accent === 'urgent' && metric.value > 0
      ? 'border-[color-mix(in_oklch,var(--chart-red)_35%,transparent)]'
      : accent === 'overdue' && metric.value > 0
      ? 'border-[color-mix(in_oklch,var(--chart-amber)_30%,transparent)]'
      : 'border-[var(--border-subtle)]';

  const Tag = onActivate ? 'button' : 'div';
  return (
    <Tag
      type={onActivate ? 'button' : undefined}
      onClick={onActivate}
      data-testid={`kpi-card-${label}`}
      className={cn(
        'flex h-full flex-col items-start justify-between gap-1 rounded-md border bg-[var(--bg-surface)] p-4 text-left',
        accentBorder,
        onActivate && 'transition-colors hover:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]',
      )}
    >
      <span className="text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      <span className="font-pretendard text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
        {valueText}
      </span>
      <div className="flex w-full items-center justify-between text-xs">
        {subLabel ? (
          <span className="text-[var(--text-quaternary)]">{subLabel}</span>
        ) : (
          <span />
        )}
        {deltaText !== null && (
          <span
            data-testid={`kpi-delta-${label}`}
            className={cn(
              'tabular-nums',
              positive && 'text-[var(--chart-emerald)]',
              negative && 'text-[var(--chart-red)]',
              !positive && !negative && 'text-[var(--text-quaternary)]',
            )}
          >
            {deltaText}
          </span>
        )}
      </div>
    </Tag>
  );
}
