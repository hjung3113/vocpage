/**
 * DashboardSettingsDialog.tsx — Wave 2 Phase E
 *
 * Right-side Sheet (per dashboard.md §11.3) for editing personal dashboard
 * preferences: widget visibility (8 widgets), default date range, heatmap X-axis.
 *
 * Out of scope (deferred): admin-default save target, GlobalTabs reorder DnD,
 * 'custom' date range picker. The 'custom' enum value is preserved as a
 * disabled, display-only option to prevent silent state loss.
 */
import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { Settings } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@shared/ui/sheet';
import type { DashboardSettings, DateRangePreset, HeatmapXAxis } from '@contracts/dashboard';
import { useDashboardSettings } from '../model/useDashboardSettings';
import { useUpdateDashboardSettings } from '../model/useUpdateDashboardSettings';
import { WIDGET_IDS } from '../defaultLayouts';
import { WIDGET_LABELS, DATE_RANGE_OPTIONS, X_AXIS_OPTIONS } from './dashboard-settings-options';

type DraftState = {
  widget_visibility: Record<string, boolean>;
  default_date_range: DateRangePreset;
  heatmap_default_x_axis: HeatmapXAxis;
};

function toDraft(s: DashboardSettings): DraftState {
  // Backfill any missing widget visibility entries to true (default = visible).
  const visibility: Record<string, boolean> = { ...s.widget_visibility };
  for (const id of WIDGET_IDS) {
    if (visibility[id] === undefined) visibility[id] = true;
  }
  return {
    widget_visibility: visibility,
    default_date_range: s.default_date_range,
    heatmap_default_x_axis: s.heatmap_default_x_axis,
  };
}

const TRIGGER_CLASS =
  'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors';

const TriggerButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>(
  function TriggerButton(props, ref) {
    return (
      <button ref={ref} type="button" className={TRIGGER_CLASS} {...props}>
        <Settings className="h-4 w-4" />
        설정
      </button>
    );
  },
);

export function DashboardSettingsDialog() {
  const { data: settings } = useDashboardSettings();
  const { mutate, isPending } = useUpdateDashboardSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);

  // Initialize draft when settings first arrive.
  useEffect(() => {
    if (settings && draft === null) setDraft(toDraft(settings));
  }, [settings, draft]);

  // Reset draft to upstream every time the panel opens.
  useEffect(() => {
    if (open && settings) setDraft(toDraft(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!settings || !draft) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <TriggerButton />
        </SheetTrigger>
      </Sheet>
    );
  }

  const handleSave = () => {
    mutate(
      {
        widget_visibility: draft.widget_visibility,
        default_date_range: draft.default_date_range,
        heatmap_default_x_axis: draft.heatmap_default_x_axis,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const handleReset = () => setDraft(toDraft(settings));
  const showCustomRadio = draft.default_date_range === 'custom';
  // Block close while a save is in flight to avoid orphaning the mutation.
  const handleOpenChange = (next: boolean) => {
    if (isPending && !next) return;
    setOpen(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <TriggerButton />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>대시보드 설정</SheetTitle>
          <SheetDescription>위젯 표시 / 기본 날짜 범위 / 히트맵 기본 X축</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-1">
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
                    checked={draft.widget_visibility[id] ?? true}
                    onChange={(e) =>
                      setDraft((d) =>
                        d
                          ? { ...d, widget_visibility: { ...d.widget_visibility, [id]: e.target.checked } }
                          : d,
                      )
                    }
                    className="h-4 w-4 cursor-pointer accent-[var(--brand)]"
                  />
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset className="mb-6" role="radiogroup" aria-label="기본 날짜 범위">
            <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">기본 날짜 범위</legend>
            <div className="flex flex-wrap gap-3">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="default_date_range"
                    value={opt.value}
                    checked={draft.default_date_range === opt.value}
                    onChange={() => setDraft((d) => (d ? { ...d, default_date_range: opt.value } : d))}
                    className="cursor-pointer accent-[var(--brand)]"
                  />
                  {opt.label}
                </label>
              ))}
              {showCustomRadio && (
                <label
                  className="flex items-center gap-2 text-sm opacity-60"
                  title="현재 저장된 사용자 지정 범위. 변경하려면 다른 옵션을 선택하세요."
                >
                  <input
                    type="radio"
                    name="default_date_range"
                    value="custom"
                    checked={draft.default_date_range === 'custom'}
                    disabled
                    readOnly
                  />
                  사용자 지정
                </label>
              )}
            </div>
          </fieldset>

          <fieldset className="mb-6" role="radiogroup" aria-label="히트맵 기본 X축">
            <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">히트맵 기본 X축</legend>
            <div className="flex flex-wrap gap-3">
              {X_AXIS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="heatmap_default_x_axis"
                    value={opt.value}
                    checked={draft.heatmap_default_x_axis === opt.value}
                    onChange={() =>
                      setDraft((d) => (d ? { ...d, heatmap_default_x_axis: opt.value } : d))
                    }
                    className="cursor-pointer accent-[var(--brand)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <SheetFooter className="gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded bg-[var(--brand)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
          >
            {isPending ? '저장 중…' : '저장'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
