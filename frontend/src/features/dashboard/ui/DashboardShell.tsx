/**
 * DashboardShell.tsx — Wave 2 Phase D
 * ResponsiveReactGridLayout wrapper. Renders 8 WidgetPlaceholder slots.
 */
import { Responsive, WidthProvider, type Layout, type LayoutItem } from 'react-grid-layout/legacy';
import type { RglLayouts } from '@contracts/dashboard';
import { WIDGET_IDS, RGL_BREAKPOINTS, RGL_COLS } from '../defaultLayouts';
import { WidgetPlaceholder } from './WidgetPlaceholder';
import { KpiVolumeWidget } from '../widgets/KpiVolumeWidget';
import { KpiQualityWidget } from '../widgets/KpiQualityWidget';
import { DistributionWidget } from '../widgets/DistributionWidget';
import { PriorityStatusMatrixWidget } from '../widgets/PriorityStatusMatrixWidget';
import { HeatmapWidget } from '../widgets/HeatmapWidget';
import { WeeklyTrendWidget } from '../widgets/WeeklyTrendWidget';
import { ProcessingSpeedWidget } from '../widgets/ProcessingSpeedWidget';
import { AssigneeStatsWidget } from '../widgets/AssigneeStatsWidget';
import { AgingVocsWidget } from '../widgets/AgingVocsWidget';

function renderWidget(widgetId: string, isEditing: boolean) {
  // Edit mode uses placeholder so drag handles remain stable.
  if (isEditing) return <WidgetPlaceholder widgetId={widgetId} isEditing={isEditing} />;
  // Phase B
  if (widgetId === 'kpi-volume') return <KpiVolumeWidget />;
  if (widgetId === 'kpi-quality') return <KpiQualityWidget />;
  // Phase C — dist-matrix is a compound slot: §2 Distribution + §3 PriorityStatusMatrix stacked.
  if (widgetId === 'dist-matrix') return (
    <div className="flex h-full flex-col gap-4" data-testid="slot-dist-matrix">
      <DistributionWidget />
      <PriorityStatusMatrixWidget />
    </div>
  );
  if (widgetId === 'heatmap') return <HeatmapWidget />;
  if (widgetId === 'trend-tag') return <WeeklyTrendWidget />;
  if (widgetId === 'sla-aging') return <ProcessingSpeedWidget />;
  if (widgetId === 'assignee') return <AssigneeStatsWidget />;
  if (widgetId === 'aging-top10') return <AgingVocsWidget />;
  return <WidgetPlaceholder widgetId={widgetId} isEditing={isEditing} />;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardShellProps {
  layouts: RglLayouts;
  isEditing: boolean;
  onLayoutChange: (currentLayout: Layout | readonly LayoutItem[], allLayouts: RglLayouts) => void;
  hiddenWidgetIds?: ReadonlySet<string>;
}

export function DashboardShell({
  layouts,
  isEditing,
  onLayoutChange,
  hiddenWidgetIds,
}: DashboardShellProps) {
  const visibleIds = WIDGET_IDS.filter((id) => !hiddenWidgetIds?.has(id));
  // P0-1: keep RGL layout entries in lockstep with rendered children. RGL
  // requires every layout item to have a matching child key — leftover
  // entries for hidden widgets corrupt onLayoutChange output.
  const visibleLayouts = hiddenWidgetIds && hiddenWidgetIds.size > 0
    ? Object.fromEntries(
        Object.entries(layouts).map(([bp, items]) => [
          bp,
          items.filter((it) => !hiddenWidgetIds.has(it.i)),
        ]),
      ) as RglLayouts
    : layouts;
  return (
    <div className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={visibleLayouts}
        breakpoints={RGL_BREAKPOINTS}
        cols={RGL_COLS}
        rowHeight={64}
        margin={[16, 16]}
        isDraggable={isEditing}
        isResizable={isEditing}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onLayoutChange={onLayoutChange as any}
        draggableHandle=".dashboard-widget-handle"
        useCSSTransforms
      >
        {visibleIds.map((widgetId) => (
          <div key={widgetId}>{renderWidget(widgetId, isEditing)}</div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
