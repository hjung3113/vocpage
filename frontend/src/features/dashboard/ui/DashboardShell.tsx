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

function renderWidget(widgetId: string, isEditing: boolean) {
  // Wave 2 Phase B — KPI widgets are wired. Other widgets remain placeholders
  // until their phases (C / E). Edit mode keeps the drag handle visible by
  // falling back to the placeholder, so resize gestures hit a stable target.
  if (isEditing) return <WidgetPlaceholder widgetId={widgetId} isEditing={isEditing} />;
  if (widgetId === 'kpi-volume') return <KpiVolumeWidget />;
  if (widgetId === 'kpi-quality') return <KpiQualityWidget />;
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
