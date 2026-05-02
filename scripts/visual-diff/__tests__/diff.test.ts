import { describe, it, expect } from 'vitest';
import { classify, diff, compareFontFamily } from '../diff.js';
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

    // Boundary tests at exactly ±1.0 and just outside ±1.001
    it('spacing diff exactly 1.0px → match=true (at boundary)', () => {
      const result = classify('padding-top', '12px', '13px');
      expect(result.match).toBe(true);
    });

    it('spacing diff exactly -1.0px → match=true (at boundary)', () => {
      const result = classify('padding-top', '13px', '12px');
      expect(result.match).toBe(true);
    });

    it('spacing diff 1.001px → match=false (just outside boundary)', () => {
      const result = classify('padding-top', '12px', '13.001px');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('spacing diff -1.001px → match=false (just outside boundary)', () => {
      const result = classify('padding-top', '13.001px', '12px');
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

    it('font-family totally different families → match=false, severity MED', () => {
      const result = classify('font-family', 'Pretendard', 'Arial');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('font-family same stack with quotes stripped → match=true', () => {
      const result = classify('font-family', '"Pretendard Variable"', 'Pretendard Variable');
      expect(result.match).toBe(true);
    });

    it('font-family react stack is prefix of proto stack → match=true', () => {
      const result = classify(
        'font-family',
        'Pretendard Variable, Pretendard, sans-serif',
        'Pretendard Variable, Pretendard, sans-serif, system-ui',
      );
      expect(result.match).toBe(true);
    });

    it('font-family proto stack is prefix of react stack → match=true', () => {
      const result = classify(
        'font-family',
        'Pretendard Variable, Pretendard, sans-serif, system-ui',
        'Pretendard Variable, Pretendard, sans-serif',
      );
      expect(result.match).toBe(true);
    });

    it('font-weight mismatch → MED', () => {
      const result = classify('font-weight', '400', '600');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('font-size within ±1.5px → match=true', () => {
      const result = classify('font-size', '14px', '14.3px');
      expect(result.match).toBe(true);
    });

    it('font-size 14 vs 16 within new ±1.5px tolerance → match=false (diff=2px)', () => {
      const result = classify('font-size', '14px', '16px');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('font-size 14 vs 15 within ±1.5px → match=true', () => {
      const result = classify('font-size', '14px', '15px');
      expect(result.match).toBe(true);
    });

    it('line-height within ±0.5px → match=true', () => {
      const result = classify('line-height', '20px', '20.4px');
      expect(result.match).toBe(true);
    });

    it('line-height 21 vs 24 within ±1.5px → match=false (diff=3px)', () => {
      const result = classify('line-height', '21px', '24px');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });

    it('line-height 21 vs 22.5 within ±1.5px → match=true', () => {
      const result = classify('line-height', '21px', '22.5px');
      expect(result.match).toBe(true);
    });
  });

  // Spacing group regression — tolerance must remain ±1px
  describe('spacing tolerance regression', () => {
    it('spacing diff exactly 1.0px → match=true (unchanged)', () => {
      const result = classify('padding-top', '12px', '13px');
      expect(result.match).toBe(true);
    });

    it('spacing diff 1.001px → match=false (unchanged boundary)', () => {
      const result = classify('padding-top', '12px', '13.001px');
      expect(result.match).toBe(false);
      expect(result.severity).toBe('MED');
    });
  });

  // compareFontFamily direct tests
  describe('compareFontFamily()', () => {
    it('identical single fonts → true', () => {
      expect(compareFontFamily('Pretendard', 'Pretendard')).toBe(true);
    });

    it('same font, different casing → true', () => {
      expect(compareFontFamily('Pretendard', 'pretendard')).toBe(true);
    });

    it('quotes stripped → true', () => {
      expect(compareFontFamily('"Pretendard Variable"', 'Pretendard Variable')).toBe(true);
    });

    it('proto is prefix of react → true', () => {
      expect(compareFontFamily('Pretendard Variable', 'Pretendard Variable, sans-serif')).toBe(
        true,
      );
    });

    it('react is prefix of proto → true', () => {
      expect(compareFontFamily('Pretendard Variable, sans-serif', 'Pretendard Variable')).toBe(
        true,
      );
    });

    it('totally different families → false', () => {
      expect(compareFontFamily('Pretendard', 'Arial')).toBe(false);
    });

    it('stacks with different first fonts → false', () => {
      expect(compareFontFamily('Arial, sans-serif', 'Pretendard, sans-serif')).toBe(false);
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
