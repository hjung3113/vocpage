/**
 * Wave 2 — react-grid-layout install smoke test (W2-4 / PR-δ).
 * Spec: docs/specs/requires/dashboard.md §커스터마이즈 v2 §라이브러리.
 * Plan: docs/specs/plans/wave-2-dashboard.md §6.2 W2-4.
 *
 * Goal: confirm RGL + types resolve and Responsive renders an empty layout
 * without crashing. Real engine integration → Phase D (W2-5).
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Responsive, WidthProvider, type Layouts } from 'react-grid-layout';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

describe('react-grid-layout install', () => {
  it('renders Responsive grid with empty layout', () => {
    const layouts: Layouts = { lg: [], md: [], sm: [] };

    const { container } = render(
      <ResponsiveGridLayout
        className="rgl-smoke"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12 }}
        rowHeight={80}
      />,
    );

    expect(container.querySelector('.rgl-smoke')).toBeInTheDocument();
  });
});
