/**
 * DashboardSettingsDialog.tsx — Wave 2 Phase E
 *
 * Right-side Sheet (per dashboard.md §11.3) for editing dashboard preferences:
 *   - widget visibility (8 widgets)
 *   - default date range (1m/3m/1y/all; 'custom' surfaces as disabled radio)
 *   - heatmap default X-axis
 *   - admin-default save target toggle (admin only)
 *   - GlobalTabs reorder + visibility (admin scope only)
 *
 * Out of scope: 'custom' date range picker — schema lacks custom_start/end_date
 * columns; tracked as FU follow-up.
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
import type {
  DashboardSettings,
  DateRangePreset,
  HeatmapXAxis,
  GlobalTabsOrderItem,
  DashboardSettingsUpdate,
} from '@contracts/dashboard';
import { useAuth } from '@features/auth';
import { useDashboardSettings } from '../model/useDashboardSettings';
import { useUpdateDashboardSettings } from '../model/useUpdateDashboardSettings';
import { WIDGET_IDS } from '../defaultLayouts';
import {
  WidgetVisibilityList,
  DateRangeRadios,
  XAxisRadios,
  ScopeToggle,
} from './DashboardSettingsForm';
import { GlobalTabsEditor } from './GlobalTabsEditor';

type Scope = 'self' | 'admin';

type DraftState = {
  widget_visibility: Record<string, boolean>;
  default_date_range: DateRangePreset;
  heatmap_default_x_axis: HeatmapXAxis;
  globaltabs_order: GlobalTabsOrderItem[] | null;
};

function toDraft(s: DashboardSettings): DraftState {
  const visibility: Record<string, boolean> = { ...s.widget_visibility };
  for (const id of WIDGET_IDS) {
    if (visibility[id] === undefined) visibility[id] = true;
  }
  return {
    widget_visibility: visibility,
    default_date_range: s.default_date_range,
    heatmap_default_x_axis: s.heatmap_default_x_axis,
    globaltabs_order: s.globaltabs_order,
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [scope, setScope] = useState<Scope>('self');
  const { data: settings } = useDashboardSettings(scope);
  const { mutate, isPending } = useUpdateDashboardSettings(scope);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);

  // Initialize draft when settings first arrive.
  useEffect(() => {
    if (settings && draft === null) setDraft(toDraft(settings));
  }, [settings, draft]);

  // Reset draft to upstream on open OR when scope changes (settings then refetches).
  useEffect(() => {
    if (open && settings) setDraft(toDraft(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope, settings]);

  const handleSave = () => {
    if (!draft) return;
    const patch: DashboardSettingsUpdate = {
      widget_visibility: draft.widget_visibility,
      default_date_range: draft.default_date_range,
      heatmap_default_x_axis: draft.heatmap_default_x_axis,
    };
    if (scope === 'admin') {
      patch.globaltabs_order = draft.globaltabs_order;
    }
    mutate(patch, { onSuccess: () => setOpen(false) });
  };

  const handleReset = () => {
    if (settings) setDraft(toDraft(settings));
  };
  const handleOpenChange = (next: boolean) => {
    if (isPending && !next) return;
    setOpen(next);
  };
  const handleScopeChange = (next: Scope) => {
    if (isPending) return;
    setScope(next);
    setDraft(null);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <TriggerButton />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>대시보드 설정</SheetTitle>
          <SheetDescription>
            {scope === 'admin'
              ? '전체 사용자에게 적용될 Admin 기본값을 편집합니다.'
              : '내 대시보드의 표시 / 기본 날짜 범위 / 히트맵 X축'}
          </SheetDescription>
        </SheetHeader>

        {isAdmin && <ScopeToggle scope={scope} onChange={handleScopeChange} />}

        {!draft ? (
          <div className="flex-1 px-1 py-4 text-sm text-[var(--text-secondary)]">불러오는 중…</div>
        ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          <WidgetVisibilityList
            visibility={draft.widget_visibility}
            onToggle={(id, next) =>
              setDraft((d) =>
                d ? { ...d, widget_visibility: { ...d.widget_visibility, [id]: next } } : d,
              )
            }
          />

          <DateRangeRadios
            value={draft.default_date_range}
            onChange={(next) => setDraft((d) => (d ? { ...d, default_date_range: next } : d))}
          />

          <XAxisRadios
            value={draft.heatmap_default_x_axis}
            onChange={(next) => setDraft((d) => (d ? { ...d, heatmap_default_x_axis: next } : d))}
          />

          {scope === 'admin' && (
            <GlobalTabsEditor
              value={draft.globaltabs_order}
              onChange={(next) => setDraft((d) => (d ? { ...d, globaltabs_order: next } : d))}
            />
          )}
        </div>
        )}

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
