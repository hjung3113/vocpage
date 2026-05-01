import { describe, it, expect } from 'vitest';
import { classify, diff } from '../diff.js';
import type { Extracted } from '../diff.js';

describe('classify()', () => {
  // Color group — exact match required, HIGH on mismatch
  describe('color group', () => {
    it('exact rgba match → match=true', () => {
      const result = classify('color', 'rgb(20, 22, 28)', 'rgb(20, 22, 28)');
      expect(result.match).toBe(true);
    });

    it('color channel differs → match=false, severity HIGH', () => {
      const result = classify('color', 'rgb(20, 22, 28)', 'rgb(24, 26, 32)');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('HIGH');
    });

    it('background-color mismatch → HIGH', () => {
      const result = classify('background-color', 'rgb(10, 10, 10)', 'rgb(20, 20, 20)');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('HIGH');
    });

    it('border-color mismatch → HIGH', () => {
      const result = classify('border-color', 'rgb(100, 100, 100)', 'rgb(200, 200, 200)');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('HIGH');
    });
  });

  // Spacing group — ±1px tolerance, MED on mismatch
  describe('spacing group', () => {
    it('same px value → match=true', () => {
      const result = classify('padding-top', '16px', '16px');
      expect(result.match).toBe(true);
    });

    it('within ±1px tolerance → match=true', () => {
      const result = classify('padding-top', '12px', '13px');
      expect(result.match).toBe(true);
    });

    it('outside ±1px tolerance → match=false, severity MED', () => {
      const result = classify('padding-top', '12px', '16px');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('margin-left within tolerance → match=true', () => {
      const result = classify('margin-left', '8px', '8.5px');
      expect(result.match).toBe(true);
    });

    it('gap mismatch beyond tolerance → MED', () => {
      const result = classify('gap', '4px', '8px');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });
  });

  // Layout group — exact match, HIGH on mismatch
  describe('layout group', () => {
    it('display flex vs block → match=false, severity HIGH', () => {
      const result = classify('display', 'flex', 'block');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('HIGH');
    });

    it('flex-direction same → match=true', () => {
      const result = classify('flex-direction', 'row', 'row');
      expect(result.match).toBe(true);
    });

    it('align-items mismatch → HIGH', () => {
      const result = classify('align-items', 'center', 'flex-start');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('HIGH');
    });
  });

  // Typography group
  describe('typography group', () => {
    it('font-family exact match → match=true', () => {
      const result = classify('font-family', 'Pretendard', 'Pretendard');
      expect(result.match).toBe(true);
    });

    it('font-family mismatch → match=false, severity MED', () => {
      const result = classify('font-family', 'Pretendard', 'Arial');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('font-weight mismatch → MED', () => {
      const result = classify('font-weight', '400', '600');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('font-size within ±0.5px → match=true', () => {
      const result = classify('font-size', '14px', '14.3px');
      expect(result.match).toBe(true);
    });

    it('font-size outside ±0.5px → match=false, MED', () => {
      const result = classify('font-size', '14px', '16px');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('line-height within ±0.5px → match=true', () => {
      const result = classify('line-height', '20px', '20.4px');
      expect(result.match).toBe(true);
    });
  });

  // Shadow group — LOW severity
  describe('shadow group', () => {
    it('box-shadow mismatch → match=false, severity LOW', () => {
      const result = classify('box-shadow', 'none', '0px 1px 3px rgba(0,0,0,0.1)');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('LOW');
    });

    it('box-shadow same (normalized) → match=true', () => {
      const result = classify('box-shadow', 'none', 'none');
      expect(result.match).toBe(true);
    });
  });
});

describe('diff()', () => {
  const makeExtracted = (componentId: string, props: Record<string, string>): Extracted => ({
    componentId,
    selector: `[data-pcomp="${componentId}"]`,
    role: 'root',
    props,
  });

  it('returns empty array when no differences', () => {
    const a = [
      makeExtracted('voc-topbar', { 'background-color': 'rgb(20, 22, 28)', display: 'flex' }),
    ];
    const b = [
      makeExtracted('voc-topbar', { 'background-color': 'rgb(20, 22, 28)', display: 'flex' }),
    ];
    const result = diff(a, b);
    expect(result).toHaveLength(0);
  });

  it('reports HIGH diff for color mismatch', () => {
    const a = [makeExtracted('voc-topbar', { 'background-color': 'rgb(20, 22, 28)' })];
    const b = [makeExtracted('voc-topbar', { 'background-color': 'rgb(30, 32, 40)' })];
    const result = diff(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('HIGH');
    expect(result[0].property).toBe('background-color');
    expect(result[0].componentId).toBe('voc-topbar');
  });

  it('ignores component ids not present on both sides', () => {
    const a = [makeExtracted('voc-topbar', { display: 'flex' })];
    const b = [makeExtracted('voc-status-filters', { display: 'flex' })];
    const result = diff(a, b);
    expect(result).toHaveLength(0);
  });

  it('sorts by severity desc (HIGH before MED before LOW)', () => {
    const a = [
      makeExtracted('voc-topbar', {
        display: 'flex',
        'padding-top': '16px',
        'box-shadow': 'none',
      }),
    ];
    const b = [
      makeExtracted('voc-topbar', {
        display: 'block', // HIGH
        'padding-top': '24px', // MED
        'box-shadow': '0px 1px 3px rgba(0,0,0,0.1)', // LOW
      }),
    ];
    const result = diff(a, b);
    expect(result[0].severity).toBe('HIGH');
    expect(result[1].severity).toBe('MED');
    expect(result[2].severity).toBe('LOW');
  });
});
