import { describe, it, expect } from 'vitest';
import { renderReport } from '../report.js';
import type { Diff, ReportMeta } from '../report.js';

const FIXED_DIFFS: Diff[] = [
  {
    componentId: 'voc-topbar',
    selector: '[data-pcomp="voc-topbar"]',
    property: 'background-color',
    prototype: 'rgb(20, 22, 28)',
    react: 'rgb(30, 32, 40)',
    severity: 'HIGH',
    suggestion: 'Use `var(--bg-panel)`',
  },
  {
    componentId: 'voc-topbar',
    selector: '[data-pcomp="voc-topbar"]',
    property: 'padding-left',
    prototype: '24px',
    react: '16px',
    severity: 'MED',
  },
  {
    componentId: 'voc-topbar',
    selector: '[data-pcomp="voc-topbar"]',
    property: 'box-shadow',
    prototype: 'none',
    react: '0px 1px 3px rgba(0,0,0,0.1)',
    severity: 'LOW',
  },
  {
    componentId: 'voc-status-filters',
    selector: '[data-pcomp="voc-status-filters"]',
    property: 'display',
    prototype: 'flex',
    react: 'block',
    severity: 'HIGH',
  },
];

const FIXED_META: ReportMeta = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  protoUrl: 'http://127.0.0.1:4174/prototype.html#page-voc',
  reactUrl: 'http://127.0.0.1:5173/voc',
  notMeasurable: [],
  selectorFallbacks: [],
};

describe('renderReport()', () => {
  it('includes the report title', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('VOC Visual Diff');
  });

  it('includes generated timestamp', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('2026-01-01T00:00:00.000Z');
  });

  it('includes prototype and react URLs', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('http://127.0.0.1:4174/prototype.html#page-voc');
    expect(md).toContain('http://127.0.0.1:5173/voc');
  });

  it('includes summary table with component rows', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('## Summary');
    expect(md).toContain('voc-topbar');
    expect(md).toContain('voc-status-filters');
  });

  it('includes per-component sections as H2', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('## voc-topbar');
    expect(md).toContain('## voc-status-filters');
  });

  it('includes severity labels', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('HIGH');
    expect(md).toContain('MED');
    expect(md).toContain('LOW');
  });

  it('includes suggestion when provided', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('Use `var(--bg-panel)`');
  });

  it('includes property and value columns', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toContain('background-color');
    expect(md).toContain('rgb(20, 22, 28)');
    expect(md).toContain('rgb(30, 32, 40)');
  });

  it('shows summary HIGH/MED/LOW counts correctly', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    // voc-topbar has 1 HIGH, 1 MED, 1 LOW
    // voc-status-filters has 1 HIGH, 0 MED, 0 LOW
    // Summary row for voc-topbar should have "1" in HIGH column and "1" in MED
    const lines = md.split('\n');
    const topbarRow = lines.find((l) => l.includes('voc-topbar') && l.includes('|'));
    expect(topbarRow).toBeTruthy();
    // Check counts appear in table row
    expect(topbarRow).toMatch(/1.*1.*1/);
  });

  it('renders [NOT MEASURABLE] banner when present', () => {
    const meta: ReportMeta = {
      ...FIXED_META,
      notMeasurable: [{ componentId: 'voc-table', reason: 'list empty' }],
    };
    const md = renderReport([], meta);
    expect(md).toContain('NOT MEASURABLE');
    expect(md).toContain('voc-table');
    expect(md).toContain('list empty');
  });

  it('renders [SELECTOR FALLBACK] banner when present', () => {
    const meta: ReportMeta = {
      ...FIXED_META,
      selectorFallbacks: ['voc-topbar', 'voc-status-filters'],
    };
    const md = renderReport(FIXED_DIFFS, meta);
    expect(md).toContain('SELECTOR FALLBACK');
  });

  it('matches golden snapshot', () => {
    const md = renderReport(FIXED_DIFFS, FIXED_META);
    expect(md).toMatchSnapshot();
  });
});
