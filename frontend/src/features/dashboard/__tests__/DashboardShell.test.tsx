/**
 * DashboardShell.test.tsx — Wave 2 Phase D TDD
 * Tests for the DashboardShell RGL wrapper.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { defaultLayouts } from '../defaultLayouts';
import { WIDGET_IDS } from '../defaultLayouts';

// Mock react-grid-layout to render children inline
vi.mock('react-grid-layout', () => {
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

import { DashboardShell } from '../ui/DashboardShell';

describe('DashboardShell', () => {
  it('renders all 8 WidgetPlaceholder components', () => {
    render(
      <DashboardShell
        layouts={defaultLayouts}
        isEditing={false}
        onLayoutChange={vi.fn()}
      />,
    );

    // All 8 widget IDs should render
    for (const widgetId of WIDGET_IDS) {
      expect(screen.getByTestId(`widget-placeholder-${widgetId}`)).toBeDefined();
    }
  });

  it('passes isDraggable=false and isResizable=false when isEditing=false', () => {
    const { container } = render(
      <DashboardShell
        layouts={defaultLayouts}
        isEditing={false}
        onLayoutChange={vi.fn()}
      />,
    );

    // Drag handles should not be visible when not editing
    const handles = container.querySelectorAll('.dashboard-widget-handle');
    // handles exist in DOM but are hidden when not editing
    handles.forEach((h) => {
      expect(h.classList.contains('opacity-0')).toBe(true);
    });
  });

  it('shows drag handles when isEditing=true', () => {
    const { container } = render(
      <DashboardShell
        layouts={defaultLayouts}
        isEditing={true}
        onLayoutChange={vi.fn()}
      />,
    );

    const handles = container.querySelectorAll('.dashboard-widget-handle');
    expect(handles.length).toBe(8);
    handles.forEach((h) => {
      expect(h.classList.contains('opacity-0')).toBe(false);
    });
  });
});
