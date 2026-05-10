/**
 * DashboardShell.test.tsx — Wave 2 Phase D + B + C TDD.
 * Tests for the DashboardShell RGL wrapper. Phase B wires KPI widgets;
 * Phase C wires the remaining 6 content slots.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { defaultLayouts, WIDGET_IDS } from '../defaultLayouts';
import { DashboardFilterProvider } from '../model/dashboardFilter';

// Mock react-grid-layout/legacy to match production import path
vi.mock('react-grid-layout/legacy', () => {
  return {
    Responsive: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="rgl-responsive">{children}</div>
    ),
    WidthProvider: (Comp: React.ComponentType) => {
      return function WidthProviderWrapper(props: Record<string, unknown>) {
        return <Comp {...props} />;
      };
    },
  };
});

// Mock CSS imports
vi.mock('react-grid-layout/css/styles.css', () => ({}));

// Mock Phase B hook
vi.mock('../model/useDashboardSummary', () => ({
  useDashboardSummary: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() }),
}));

// Mock Phase C hooks so widgets mount without MSW
vi.mock('../model/useDistribution', () => ({ useDistribution: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() }) }));
vi.mock('../model/usePriorityStatusMatrix', () => ({ usePriorityStatusMatrix: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() }) }));
vi.mock('../model/useHeatmap', () => ({ useHeatmap: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() }) }));
vi.mock('../model/useWeeklyTrend', () => ({ useWeeklyTrend: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() }) }));
vi.mock('../model/useProcessingSpeed', () => ({ useProcessingSpeed: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn(), dim: 'all', setDim: vi.fn() }) }));
vi.mock('../model/useAssigneeStats', () => ({ useAssigneeStats: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() }) }));
vi.mock('../model/useAgingVocs', () => ({ useAgingVocs: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() }) }));

import { DashboardShell } from '../ui/DashboardShell';

function renderShell(props: { isEditing: boolean }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <DashboardFilterProvider initial={{ range: '1m' }}>
          <DashboardShell
            layouts={defaultLayouts}
            isEditing={props.isEditing}
            onLayoutChange={vi.fn()}
          />
        </DashboardFilterProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('DashboardShell', () => {
  it('renders all 8 widget slots — Phase B+C slots use real widgets', () => {
    renderShell({ isEditing: false });
    expect(screen.getByTestId('widget-kpi-volume')).toBeDefined();
    expect(screen.getByTestId('widget-kpi-quality')).toBeDefined();
    // Phase C widgets are now wired — dist-matrix slot stacks Distribution + Matrix
    expect(screen.getByTestId('widget-distribution')).toBeDefined();
    expect(screen.getByTestId('widget-priority-status-matrix')).toBeDefined();
    expect(screen.getByTestId('slot-dist-matrix')).toBeDefined();
    expect(screen.getByTestId('widget-heatmap')).toBeDefined();
    expect(screen.getByTestId('widget-weekly-trend')).toBeDefined();
    expect(screen.getByTestId('widget-processing-speed')).toBeDefined();
    expect(screen.getByTestId('widget-assignee-stats')).toBeDefined();
    expect(screen.getByTestId('widget-aging-vocs')).toBeDefined();
    // No placeholder slots remain for these widget IDs
    for (const widgetId of WIDGET_IDS) {
      expect(screen.queryByTestId(`widget-placeholder-${widgetId}`)).toBeNull();
    }
  });

  it('edit mode falls back to placeholders for KPI slots so drag handles are present', () => {
    const { container } = renderShell({ isEditing: true });
    expect(screen.queryByTestId('widget-kpi-volume')).toBeNull();
    expect(screen.getByTestId('widget-placeholder-kpi-volume')).toBeDefined();
    const handles = container.querySelectorAll('.dashboard-widget-handle');
    expect(handles.length).toBe(8);
    handles.forEach((h) => {
      expect(h.classList.contains('opacity-0')).toBe(false);
    });
  });

  it('drag handles are hidden when isEditing=false', () => {
    const { container } = renderShell({ isEditing: false });
    // Phase C real widgets have no drag handles; only placeholders in edit mode do.
    const handles = container.querySelectorAll('.dashboard-widget-handle');
    handles.forEach((h) => {
      expect(h.classList.contains('opacity-0')).toBe(true);
    });
  });
});
