/**
 * defaultLayouts.ts — Wave 2 Phase D
 * RGL breakpoints, column config, widget IDs, and admin-default layouts.
 */
import type { RglLayouts } from '@contracts/dashboard';

export const RGL_BREAKPOINTS = { lg: 996, md: 768, sm: 480, xs: 0, xl: 1200 };
export const RGL_COLS = { xs: 1, sm: 2, md: 6, lg: 12, xl: 12 };

export const WIDGET_IDS = [
  'kpi-volume',
  'kpi-quality',
  'dist-matrix',
  'heatmap',
  'trend-tag',
  'sla-aging',
  'assignee',
  'aging-top10',
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

/**
 * Admin default layouts for all 5 breakpoints × 8 widgets.
 * rowHeight=64, so h:4 ≈ 256px, h:5 ≈ 320px, h:6 ≈ 384px.
 *
 * lg/xl (12 cols):
 *   Row 0: kpi-volume (w:3), kpi-quality (w:3), sla-aging (w:3), assignee (w:3) [y=0]
 *   Row 1: dist-matrix (w:6), trend-tag (w:6) [y=4]
 *   Row 2: heatmap (w:12) [y=9]
 *   Row 3: aging-top10 (w:12) [y=14]
 *
 * md (6 cols):
 *   Row 0: kpi-volume (w:3), kpi-quality (w:3) [y=0]
 *   Row 1: sla-aging (w:3), assignee (w:3) [y=4]
 *   Row 2: dist-matrix (w:6) [y=8]
 *   Row 3: trend-tag (w:6) [y=13]
 *   Row 4: heatmap (w:6) [y=18]
 *   Row 5: aging-top10 (w:6) [y=23]
 *
 * sm (2 cols):
 *   Two-column stacked, each widget w:1 or w:2
 *
 * xs (1 col):
 *   Single column stack, each widget x:0, w:1
 */
export const defaultLayouts: RglLayouts = {
  xl: [
    { i: 'kpi-volume',  x: 0,  y: 0,  w: 3, h: 4 },
    { i: 'kpi-quality', x: 3,  y: 0,  w: 3, h: 4 },
    { i: 'sla-aging',   x: 6,  y: 0,  w: 3, h: 4 },
    { i: 'assignee',    x: 9,  y: 0,  w: 3, h: 4 },
    { i: 'dist-matrix', x: 0,  y: 4,  w: 6, h: 5 },
    { i: 'trend-tag',   x: 6,  y: 4,  w: 6, h: 5 },
    { i: 'heatmap',     x: 0,  y: 9,  w: 12, h: 5 },
    { i: 'aging-top10', x: 0,  y: 14, w: 12, h: 6 },
  ],
  lg: [
    { i: 'kpi-volume',  x: 0,  y: 0,  w: 3, h: 4 },
    { i: 'kpi-quality', x: 3,  y: 0,  w: 3, h: 4 },
    { i: 'sla-aging',   x: 6,  y: 0,  w: 3, h: 4 },
    { i: 'assignee',    x: 9,  y: 0,  w: 3, h: 4 },
    { i: 'dist-matrix', x: 0,  y: 4,  w: 6, h: 5 },
    { i: 'trend-tag',   x: 6,  y: 4,  w: 6, h: 5 },
    { i: 'heatmap',     x: 0,  y: 9,  w: 12, h: 5 },
    { i: 'aging-top10', x: 0,  y: 14, w: 12, h: 6 },
  ],
  md: [
    { i: 'kpi-volume',  x: 0, y: 0,  w: 3, h: 4 },
    { i: 'kpi-quality', x: 3, y: 0,  w: 3, h: 4 },
    { i: 'sla-aging',   x: 0, y: 4,  w: 3, h: 4 },
    { i: 'assignee',    x: 3, y: 4,  w: 3, h: 4 },
    { i: 'dist-matrix', x: 0, y: 8,  w: 6, h: 5 },
    { i: 'trend-tag',   x: 0, y: 13, w: 6, h: 5 },
    { i: 'heatmap',     x: 0, y: 18, w: 6, h: 5 },
    { i: 'aging-top10', x: 0, y: 23, w: 6, h: 6 },
  ],
  sm: [
    { i: 'kpi-volume',  x: 0, y: 0,  w: 1, h: 4 },
    { i: 'kpi-quality', x: 1, y: 0,  w: 1, h: 4 },
    { i: 'sla-aging',   x: 0, y: 4,  w: 1, h: 4 },
    { i: 'assignee',    x: 1, y: 4,  w: 1, h: 4 },
    { i: 'dist-matrix', x: 0, y: 8,  w: 2, h: 5 },
    { i: 'trend-tag',   x: 0, y: 13, w: 2, h: 5 },
    { i: 'heatmap',     x: 0, y: 18, w: 2, h: 5 },
    { i: 'aging-top10', x: 0, y: 23, w: 2, h: 6 },
  ],
  xs: [
    { i: 'kpi-volume',  x: 0, y: 0,  w: 1, h: 4 },
    { i: 'kpi-quality', x: 0, y: 4,  w: 1, h: 4 },
    { i: 'sla-aging',   x: 0, y: 8,  w: 1, h: 4 },
    { i: 'assignee',    x: 0, y: 12, w: 1, h: 4 },
    { i: 'dist-matrix', x: 0, y: 16, w: 1, h: 5 },
    { i: 'trend-tag',   x: 0, y: 21, w: 1, h: 5 },
    { i: 'heatmap',     x: 0, y: 26, w: 1, h: 5 },
    { i: 'aging-top10', x: 0, y: 31, w: 1, h: 6 },
  ],
};
