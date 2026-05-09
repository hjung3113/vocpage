/**
 * Wave 2 W2-3 / PR-γ — shared/contracts/dashboard zod 회귀.
 *
 * Spec: docs/specs/requires/dashboard.md §커스터마이즈 v2
 *       (RGL 12-col bounds, breakpoint-keyed widget_sizes v2, 2-tier 잠금).
 * Plan: docs/specs/plans/wave-2-dashboard.md §3 W2-D7 (TDD bounds + verb parity).
 *
 * Codex:rescue 리뷰 §2 zod gotcha 반영 — bounds (x>=0, x+w<=12, w>=1, h>=1)
 * 강제 검증.
 */
import {
  WidgetId,
  WidgetLayout,
  WidgetSizesV2,
  DashboardSettings,
  DashboardSettingsPutBody,
  DefaultDateRange,
  HeatmapXAxis,
} from '../../../shared/contracts/dashboard';

describe('shared/contracts/dashboard — Wave 2 W2-3', () => {
  describe('WidgetId enum (11 stable IDs)', () => {
    const ids = [
      'kpi',
      'distribution',
      'priority-status-matrix',
      'heatmap',
      'weekly-trend',
      'tag-bar',
      'system-card',
      'assignee-table',
      'aging-top10',
      'sla',
      'aging',
    ];

    it.each(ids)('accepts %s', (id) => {
      expect(WidgetId.parse(id)).toBe(id);
    });

    it('rejects unknown widget id', () => {
      expect(() => WidgetId.parse('unknown-widget')).toThrow();
    });
  });

  describe('WidgetLayout — 12-col bounds (codex §2)', () => {
    it('accepts a valid layout', () => {
      expect(WidgetLayout.parse({ x: 0, y: 0, w: 12, h: 2 })).toMatchObject({
        x: 0,
        w: 12,
      });
    });

    it('rejects x + w > 12', () => {
      expect(() => WidgetLayout.parse({ x: 6, y: 0, w: 7, h: 2 })).toThrow(/x \+ w/);
    });

    it('rejects negative x', () => {
      expect(() => WidgetLayout.parse({ x: -1, y: 0, w: 4, h: 2 })).toThrow();
    });

    it('rejects non-integer w', () => {
      expect(() => WidgetLayout.parse({ x: 0, y: 0, w: 3.5, h: 2 })).toThrow();
    });

    it('rejects w < 1', () => {
      expect(() => WidgetLayout.parse({ x: 0, y: 0, w: 0, h: 2 })).toThrow();
    });

    it('accepts static flag', () => {
      const out = WidgetLayout.parse({ x: 0, y: 0, w: 4, h: 2, static: true });
      expect(out.static).toBe(true);
    });
  });

  describe('WidgetSizesV2 — breakpoint-keyed', () => {
    it('accepts lg-only entry (md/sm fallback to RGL)', () => {
      const out = WidgetSizesV2.parse({
        kpi: { lg: { x: 0, y: 0, w: 12, h: 2 } },
      });
      expect(out.kpi.lg.w).toBe(12);
    });

    it('accepts lg + md + sm combo', () => {
      const out = WidgetSizesV2.parse({
        heatmap: {
          lg: { x: 0, y: 4, w: 12, h: 6 },
          md: { x: 0, y: 4, w: 12, h: 6 },
          sm: { x: 0, y: 4, w: 12, h: 8 },
        },
      });
      expect(out.heatmap.sm?.h).toBe(8);
    });

    it('rejects when nested layout violates bounds', () => {
      expect(() =>
        WidgetSizesV2.parse({
          kpi: { lg: { x: 10, y: 0, w: 5, h: 2 } },
        }),
      ).toThrow();
    });
  });

  describe('DefaultDateRange + HeatmapXAxis enums', () => {
    it('DefaultDateRange accepts the 5 spec values', () => {
      ['1m', '3m', '1y', 'all', 'custom'].forEach((v) => {
        expect(DefaultDateRange.parse(v)).toBe(v);
      });
    });

    it('HeatmapXAxis accepts the 3 spec values', () => {
      ['status', 'priority', 'tag'].forEach((v) => {
        expect(HeatmapXAxis.parse(v)).toBe(v);
      });
    });
  });

  describe('DashboardSettings — full row shape', () => {
    it('parses an Admin row (locked_widgets populated)', () => {
      const out = DashboardSettings.parse({
        widget_order: ['kpi', 'heatmap'],
        widget_visibility: { kpi: { visible: true }, heatmap: { visible: true } },
        widget_sizes: {
          kpi: { lg: { x: 0, y: 0, w: 12, h: 2 } },
          heatmap: { lg: { x: 0, y: 2, w: 12, h: 6 } },
        },
        locked_widgets: ['kpi'],
        default_date_range: '1m',
        heatmap_default_x_axis: 'status',
        globaltabs_order: null,
      });
      expect(out.locked_widgets).toEqual(['kpi']);
    });
  });

  describe('DashboardSettingsPutBody — partial update body', () => {
    it('accepts a single-field PUT (default_date_range)', () => {
      const out = DashboardSettingsPutBody.parse({ default_date_range: '3m' });
      expect(out.default_date_range).toBe('3m');
    });

    it('accepts an empty body (no-op preserve)', () => {
      expect(DashboardSettingsPutBody.parse({})).toEqual({});
    });

    it('rejects unknown widget id inside locked_widgets', () => {
      expect(() => DashboardSettingsPutBody.parse({ locked_widgets: ['ghost'] })).toThrow();
    });
  });
});
