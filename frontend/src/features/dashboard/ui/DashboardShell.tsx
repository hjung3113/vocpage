/**
 * DashboardShell.tsx — Wave 2 Phase D
 * ResponsiveReactGridLayout wrapper. Renders 8 WidgetPlaceholder slots.
 */
import { Responsive, WidthProvider, type Layout, type LayoutItem } from 'react-grid-layout/legacy';
import type { RglLayouts } from '@contracts/dashboard';
import { WIDGET_IDS, RGL_BREAKPOINTS, RGL_COLS } from '../defaultLayouts';
import { WidgetPlaceholder } from './WidgetPlaceholder';

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
          <div key={widgetId}>
            <WidgetPlaceholder widgetId={widgetId} isEditing={isEditing} />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
