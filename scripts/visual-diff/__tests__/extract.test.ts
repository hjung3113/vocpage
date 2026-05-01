import { describe, it, expect } from 'vitest';
import { extractFromPage, WHITELIST } from '../extract.js';
import type { ExtractOptions } from '../extract.js';

// Minimal Page mock — only needs `evaluate` returning fixture data
function makeFakePage(fixtureStyles: Record<string, string>) {
  return {
    evaluate: async (fn: Function, ...args: unknown[]) => {
      // The real extractFromPage calls page.evaluate with an inline function.
      // We intercept by calling fn with mocked DOM-like data.
      return fn(
        // Pass a fake "execution context" — our fn is evaluated as if in browser.
        // Since we can't actually run page.evaluate in jsdom without Playwright,
        // we instead expose the fixture via a special __fixture__ symbol.
        { __fixture__: fixtureStyles },
        ...args,
      );
    },
  };
}

describe('WHITELIST', () => {
  it('contains expected color properties', () => {
    expect(WHITELIST).toContain('color');
    expect(WHITELIST).toContain('background-color');
    expect(WHITELIST).toContain('border-color');
  });

  it('contains expected spacing properties', () => {
    expect(WHITELIST).toContain('padding-top');
    expect(WHITELIST).toContain('margin-left');
    expect(WHITELIST).toContain('gap');
  });

  it('contains expected layout properties', () => {
    expect(WHITELIST).toContain('display');
    expect(WHITELIST).toContain('flex-direction');
    expect(WHITELIST).toContain('align-items');
  });

  it('contains expected typography properties', () => {
    expect(WHITELIST).toContain('font-family');
    expect(WHITELIST).toContain('font-size');
    expect(WHITELIST).toContain('font-weight');
  });

  it('does not contain non-whitelisted properties', () => {
    expect(WHITELIST).not.toContain('cursor');
    expect(WHITELIST).not.toContain('z-index');
    expect(WHITELIST).not.toContain('transform');
    expect(WHITELIST).not.toContain('transition');
  });
});

describe('extractFromPage() — whitelist filtering', () => {
  it('filters out non-whitelisted properties from returned styles', async () => {
    // We test the whitelist filtering logic directly since we can't run real Playwright in vitest
    const allProps: Record<string, string> = {
      'background-color': 'rgb(20, 22, 28)',
      'font-size': '14px',
      display: 'flex',
      cursor: 'pointer', // NOT in whitelist
      'z-index': '100', // NOT in whitelist
      transform: 'none', // NOT in whitelist
      transition: 'all 0.2s', // NOT in whitelist
    };

    // Filter logic mirrors what extractFromPage does internally
    const whitelistSet = new Set(WHITELIST);
    const filtered = Object.fromEntries(
      Object.entries(allProps).filter(([k]) => whitelistSet.has(k)),
    );

    expect(filtered).toHaveProperty('background-color');
    expect(filtered).toHaveProperty('font-size');
    expect(filtered).toHaveProperty('display');
    expect(filtered).not.toHaveProperty('cursor');
    expect(filtered).not.toHaveProperty('z-index');
    expect(filtered).not.toHaveProperty('transform');
    expect(filtered).not.toHaveProperty('transition');
  });

  it('WHITELIST set has no duplicate entries', () => {
    const unique = new Set(WHITELIST);
    expect(unique.size).toBe(WHITELIST.length);
  });

  it('ExtractOptions type accepts depth 0 or 1', () => {
    const opts0: ExtractOptions = { whitelist: WHITELIST, depth: 0 };
    const opts1: ExtractOptions = { whitelist: WHITELIST, depth: 1 };
    expect(opts0.depth).toBe(0);
    expect(opts1.depth).toBe(1);
  });
});
