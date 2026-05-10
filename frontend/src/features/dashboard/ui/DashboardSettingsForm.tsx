/**
 * DashboardSettingsForm.tsx — Wave 2 Phase E
 * Reusable form sections rendered inside DashboardSettingsDialog.
 */
import type { DateRangePreset, HeatmapXAxis } from '@contracts/dashboard';

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
}

export function DateRangeRadios({ value, onChange }: DateRangeRadiosProps) {
  const showCustom = value === 'custom';
  return (
    <fieldset className="mb-6" role="radiogroup" aria-label="기본 날짜 범위">
      <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">기본 날짜 범위</legend>
      <div className="flex flex-wrap gap-3">
        {DATE_RANGE_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="default_date_range"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="cursor-pointer accent-[var(--brand)]"
            />
            {opt.label}
          </label>
        ))}
        {showCustom && (
          <label
            className="flex items-center gap-2 text-sm opacity-60"
            title="현재 저장된 사용자 지정 범위. 변경하려면 다른 옵션을 선택하세요."
          >
            <input type="radio" name="default_date_range" value="custom" checked disabled readOnly />
            사용자 지정
          </label>
        )}
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
