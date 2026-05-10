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
  // Phase C
  if (widgetId === 'dist-matrix') return <DistributionWidget />;
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
}

export function DashboardShell({ layouts, isEditing, onLayoutChange }: DashboardShellProps) {
  return (
    <div className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
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
        {WIDGET_IDS.map((widgetId) => (
          <div key={widgetId}>{renderWidget(widgetId, isEditing)}</div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
