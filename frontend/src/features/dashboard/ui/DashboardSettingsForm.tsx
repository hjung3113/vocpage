/**
 * DashboardSettingsForm.tsx — Wave 2 Phase E + ADR 0006.
 * Reusable form sections rendered inside DashboardSettingsDialog.
 */
import type { Dispatch, SetStateAction } from 'react';
import type { DateRangePreset, HeatmapXAxis } from '@contracts/dashboard';
import { CustomDateRangePicker } from './CustomDateRangePicker';

type Scope = 'self' | 'admin';

interface ScopeToggleProps {
  scope: Scope;
  onChange: (next: Scope) => void;
}

export function ScopeToggle({ scope, onChange }: ScopeToggleProps) {
  return (
    <fieldset role="radiogroup" aria-label="저장 대상">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        저장 대상
      </legend>
      <div className="flex gap-2">
        {(['self', 'admin'] as const).map((s) => {
          const label = s === 'self' ? '내 설정' : '기본값 (Admin)';
          const active = scope === s;
          return (
            <label
              key={s}
              className={`flex-1 cursor-pointer rounded border px-3 py-1.5 text-center text-sm ${
                active
                  ? 'border-[var(--brand)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <input
                type="radio"
                name="scope"
                value={s}
                aria-label={label}
                checked={active}
                onChange={() => onChange(s)}
                className="sr-only"
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
import { WIDGET_IDS } from '../defaultLayouts';
import { WIDGET_LABELS, DATE_RANGE_OPTIONS, X_AXIS_OPTIONS } from './dashboard-settings-options';

interface WidgetVisibilityListProps {
  visibility: Record<string, boolean>;
  onToggle: (id: string, next: boolean) => void;
}

export function WidgetVisibilityList({ visibility, onToggle }: WidgetVisibilityListProps) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">위젯 표시</legend>
      <ul className="space-y-2">
        {WIDGET_IDS.map((id) => (
          <li key={id} className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">{WIDGET_LABELS[id]}</span>
            <input
              type="checkbox"
              role="switch"
              aria-label={WIDGET_LABELS[id]}
              checked={visibility[id] ?? true}
              onChange={(e) => onToggle(id, e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[var(--brand)]"
            />
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

interface DateRangeRadiosProps {
  value: DateRangePreset;
  onChange: (next: DateRangePreset) => void;
  /** ADR 0006 §7: scope='admin' 시 'custom' 선택 차단 + tooltip. */
  scope?: 'self' | 'admin';
}

export function DateRangeRadios({ value, onChange, scope = 'self' }: DateRangeRadiosProps) {
  const customAdminBlocked = scope === 'admin';
  return (
    <fieldset className="mb-6" role="radiogroup" aria-label="기본 날짜 범위">
      <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">기본 날짜 범위</legend>
      <div className="flex flex-wrap gap-3">
        {DATE_RANGE_OPTIONS.map((opt) => {
          const blocked = opt.value === 'custom' && customAdminBlocked;
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-2 text-sm ${blocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              title={
                blocked
                  ? "Admin 기본값은 절대 날짜라 시간 경과 시 stale 됩니다. 사용자별 'custom' 은 가능, Admin 전체 기본은 NextGen 의 상대 offset (ADR 후속) 에서 지원 예정."
                  : undefined
              }
            >
              <input
                type="radio"
                name="default_date_range"
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={blocked}
                className="cursor-pointer accent-[var(--brand)] disabled:cursor-not-allowed"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface XAxisRadiosProps {
  value: HeatmapXAxis;
  onChange: (next: HeatmapXAxis) => void;
}

export function XAxisRadios({ value, onChange }: XAxisRadiosProps) {
  return (
    <fieldset className="mb-6" role="radiogroup" aria-label="히트맵 기본 X축">
      <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">히트맵 기본 X축</legend>
      <div className="flex flex-wrap gap-3">
        {X_AXIS_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="heatmap_default_x_axis"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="cursor-pointer accent-[var(--brand)]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** ADR 0006: radios + (when 'custom') range picker. Receives draft slice
 * + setter to keep Dialog under max-lines. Admin scope excludes the picker. */
export interface DateRangeDraftSlice {
  default_date_range: DateRangePreset;
  custom_start_date: string | null;
  custom_end_date: string | null;
}

interface DateRangeSectionProps<T extends DateRangeDraftSlice> {
  draft: T;
  scope: 'self' | 'admin';
  setDraft: Dispatch<SetStateAction<T | null>>;
}

export function DateRangeSection<T extends DateRangeDraftSlice>({
  draft,
  scope,
  setDraft,
}: DateRangeSectionProps<T>) {
  return (
    <>
      <DateRangeRadios
        value={draft.default_date_range}
        scope={scope}
        onChange={(next) =>
          setDraft((d) =>
            d
              ? {
                  ...d,
                  default_date_range: next,
                  custom_start_date: next === 'custom' ? d.custom_start_date : null,
                  custom_end_date: next === 'custom' ? d.custom_end_date : null,
                }
              : d,
          )
        }
      />
      {draft.default_date_range === 'custom' && scope !== 'admin' && (
        <CustomDateRangePicker
          startDate={draft.custom_start_date}
          endDate={draft.custom_end_date}
          onChange={({ start, end }) =>
            setDraft((d) =>
              d ? { ...d, custom_start_date: start, custom_end_date: end } : d,
            )
          }
        />
      )}
    </>
  );
}
