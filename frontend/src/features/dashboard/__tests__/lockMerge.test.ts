/**
 * lockMerge.test.ts — Wave 2 Phase D TDD
 * Pure unit tests for mergeLockedLayout.
 */
import { describe, it, expect } from 'vitest';
import { mergeLockedLayout } from '../lockMerge';
import type { RglLayouts } from '@contracts/dashboard';

const adminDefault = {
  lg: [
    { i: 'kpi-volume', x: 0, y: 0, w: 3, h: 4 },
    { i: 'kpi-quality', x: 3, y: 0, w: 3, h: 4 },
    { i: 'dist-matrix', x: 0, y: 4, w: 6, h: 5 },
    { i: 'heatmap', x: 0, y: 9, w: 12, h: 5 },
  ],
  xs: [
    { i: 'kpi-volume', x: 0, y: 0, w: 1, h: 4 },
    { i: 'kpi-quality', x: 0, y: 4, w: 1, h: 4 },
    { i: 'dist-matrix', x: 0, y: 8, w: 1, h: 5 },
    { i: 'heatmap', x: 0, y: 13, w: 1, h: 5 },
  ],
} as unknown as RglLayouts;

const userDraft = {
  lg: [
    { i: 'kpi-volume', x: 6, y: 0, w: 3, h: 4 }, // user moved this
    { i: 'kpi-quality', x: 9, y: 0, w: 3, h: 4 },
    { i: 'dist-matrix', x: 6, y: 4, w: 6, h: 5 },
    { i: 'heatmap', x: 0, y: 9, w: 12, h: 6 }, // user resized this
  ],
  xs: [
    { i: 'kpi-volume', x: 0, y: 0, w: 1, h: 4 },
    { i: 'kpi-quality', x: 0, y: 4, w: 1, h: 4 },
    { i: 'dist-matrix', x: 0, y: 8, w: 1, h: 5 },
    { i: 'heatmap', x: 0, y: 13, w: 1, h: 6 },
  ],
} as unknown as RglLayouts;

describe('mergeLockedLayout', () => {
  it('uses admin layout for locked widget ids, user draft for others', () => {
    const result = mergeLockedLayout(adminDefault, userDraft, ['kpi-volume']);

    // kpi-volume is locked → should come from admin
    const lgItems = result.lg!;
    const kpiVolume = lgItems.find((item) => item.i === 'kpi-volume');
    expect(kpiVolume?.x).toBe(0); // admin x, not user's 6

    // heatmap is not locked → user draft preserved
    const heatmap = lgItems.find((item) => item.i === 'heatmap');
    expect(heatmap?.h).toBe(6); // user h=6, not admin h=5
  });

  it('preserves user draft entirely when lockedFields is empty', () => {
    const result = mergeLockedLayout(adminDefault, userDraft, []);

    const lgItems = result.lg!;
    const kpiVolume = lgItems.find((item) => item.i === 'kpi-volume');
    expect(kpiVolume?.x).toBe(6); // user moved, preserved

    const heatmap = lgItems.find((item) => item.i === 'heatmap');
    expect(heatmap?.h).toBe(6); // user resized, preserved
  });

  it('falls back to admin layout for breakpoints missing in userDraft', () => {
    const partialUserDraft = {
      lg: userDraft.lg,
      // xs missing
    } as unknown as RglLayouts;

    const result = mergeLockedLayout(adminDefault, partialUserDraft, []);

    // xs missing in userDraft → fall back fully to admin
    const xsItems = result.xs!;
    expect(xsItems).toBeDefined();
    expect(xsItems.find((item) => item.i === 'heatmap')?.h).toBe(5); // admin h=5
  });

  it('locks all widgets when all ids are in lockedFields', () => {
    const result = mergeLockedLayout(adminDefault, userDraft, [
      'kpi-volume',
      'kpi-quality',
      'dist-matrix',
      'heatmap',
    ]);

    const lgItems = result.lg!;
    // All should match admin
    expect(lgItems.find((item) => item.i === 'heatmap')?.h).toBe(5); // admin h=5
    expect(lgItems.find((item) => item.i === 'kpi-volume')?.x).toBe(0); // admin x=0
  });
});
