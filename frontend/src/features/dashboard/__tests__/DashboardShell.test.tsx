/**
 * DashboardShell.test.tsx — Wave 2 Phase D + B TDD.
 * Tests for the DashboardShell RGL wrapper. Phase B wires KpiVolumeWidget
 * and KpiQualityWidget for the `kpi-volume` / `kpi-quality` slots; the
 * remaining 6 slots stay as placeholders.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Phase B widgets call /api/dashboard/summary — mock the hook so the shell
// can mount without an MSW server in this unit-level test.
vi.mock('../model/useDashboardSummary', () => ({
  useDashboardSummary: () => ({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() }),
}));

import { DashboardShell } from '../ui/DashboardShell';

function renderShell(props: { isEditing: boolean }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DashboardFilterProvider initial={{ range: '1m' }}>
        <DashboardShell
          layouts={defaultLayouts}
          isEditing={props.isEditing}
          onLayoutChange={vi.fn()}
        />
      </DashboardFilterProvider>
    </QueryClientProvider>,
  );
}

describe('DashboardShell', () => {
  it('renders all 8 widgets — KPI slots use real widgets, others are placeholders', () => {
    renderShell({ isEditing: false });
    expect(screen.getByTestId('widget-kpi-volume')).toBeDefined();
    expect(screen.getByTestId('widget-kpi-quality')).toBeDefined();
    for (const widgetId of WIDGET_IDS) {
      if (widgetId === 'kpi-volume' || widgetId === 'kpi-quality') continue;
      expect(screen.getByTestId(`widget-placeholder-${widgetId}`)).toBeDefined();
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
    // Only the 6 placeholder slots have handles in display mode (kpi widgets don't).
    const handles = container.querySelectorAll('.dashboard-widget-handle');
    handles.forEach((h) => {
      expect(h.classList.contains('opacity-0')).toBe(true);
    });
  });
});
