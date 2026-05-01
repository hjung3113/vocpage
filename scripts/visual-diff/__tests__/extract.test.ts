import { describe, it, expect } from 'vitest';
import { extractFromPage, isMissing, WHITELIST } from '../extract.js';
import type { ExtractOptions } from '../extract.js';

// ---------------------------------------------------------------------------
// Minimal jsdom-compatible Page mock.
// The real browserFnSrc serialises itself and runs in-page, calling
// document.querySelector + getComputedStyle. We replicate that logic
// in a fake page.evaluate so that we exercise the REAL browser-side
// function path (not a stub that returns fixture data).
// ---------------------------------------------------------------------------
function makeJsdomPage(
  elements: Array<{
    selector: string;
    styles: Record<string, string>;
    children?: Array<Record<string, string>>;
  }>,
) {
  return {
    async evaluate(fn: Function, arg: unknown): Promise<unknown> {
      // Build a fake document that matches the evaluated browser fn's contract:
      // document.querySelector(sel) returns an element with getComputedStyle support.
      const fakeDoc = {
        querySelector(sel: string) {
          const match = elements.find((e) => e.selector === sel);
          if (!match) return null;
          const makeEl = (
            styles: Record<string, string>,
            childStyles?: Array<Record<string, string>>,
          ) => ({
            children: (childStyles ?? []).map((cs) => makeEl(cs)),
            // getComputedStyle is called via window.getComputedStyle(el)
            __styles: styles,
          });
          return makeEl(match.styles, match.children);
        },
      };

      const fakeWindow = {
        getComputedStyle(el: { __styles: Record<string, string> }) {
          return {
            getPropertyValue(prop: string): string {
              return el.__styles[prop] ?? '';
            },
          };
        },
      };

      // Patch the globals the serialised browser fn references
      const patchedFn = new Function(
        'document',
        'window',
        `return (${fn.toString()})(arguments[2])`,
      );
      // TypeScript doesn't know about the extra arg — cast
      return (patchedFn as Function)(fakeDoc, fakeWindow, arg);
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

  it('has no duplicate entries', () => {
    const unique = new Set(WHITELIST);
    expect(unique.size).toBe(WHITELIST.length);
  });
});

describe('ExtractOptions type', () => {
  it('accepts depth 0 or 1', () => {
    const opts0: ExtractOptions = { whitelist: WHITELIST, depth: 0 };
    const opts1: ExtractOptions = { whitelist: WHITELIST, depth: 1 };
    expect(opts0.depth).toBe(0);
    expect(opts1.depth).toBe(1);
  });
});

describe('extractFromPage() — real browser-fn path via jsdom mock', () => {
  const opts: ExtractOptions = { whitelist: WHITELIST, depth: 0 };

  it('returns a root entry with whitelisted props when selector matches', async () => {
    const page = makeJsdomPage([
      {
        selector: '#topbar',
        styles: {
          'background-color': 'rgb(20, 22, 28)',
          display: 'flex',
          cursor: 'pointer', // NOT in whitelist — must be stripped
        },
      },
    ]);

    const results = await extractFromPage(
      page as any,
      [{ componentId: 'voc-topbar', selector: '#topbar' }],
      opts,
    );

    expect(results).toHaveLength(1);
    const entry = results[0];
    expect(isMissing(entry)).toBe(false);
    if (!isMissing(entry)) {
      expect(entry.componentId).toBe('voc-topbar');
      expect(entry.role).toBe('root');
      expect(entry.props['background-color']).toBe('rgb(20, 22, 28)');
      expect(entry.props['display']).toBe('flex');
      expect(entry.props['cursor']).toBeUndefined();
    }
  });

  it('emits a MISSING sentinel when selector finds no element', async () => {
    const page = makeJsdomPage([]); // no elements registered

    const results = await extractFromPage(
      page as any,
      [{ componentId: 'voc-table', selector: '.list-area' }],
      opts,
    );

    expect(results).toHaveLength(1);
    expect(isMissing(results[0])).toBe(true);
    if (isMissing(results[0])) {
      expect(results[0].componentId).toBe('voc-table');
      expect(results[0].selector).toBe('.list-area');
    }
  });

  it('skips SIZING_PROPS when value is auto/none/normal', async () => {
    const page = makeJsdomPage([
      {
        selector: '#el',
        styles: {
          width: 'auto', // should be skipped
          height: 'none', // should be skipped
          display: 'flex', // whitelisted, non-SIZING → kept
        },
      },
    ]);

    const results = await extractFromPage(
      page as any,
      [{ componentId: 'voc-topbar', selector: '#el' }],
      opts,
    );

    expect(isMissing(results[0])).toBe(false);
    if (!isMissing(results[0])) {
      expect(results[0].props['width']).toBeUndefined();
      expect(results[0].props['height']).toBeUndefined();
      expect(results[0].props['display']).toBe('flex');
    }
  });

  it('extracts children when depth=1', async () => {
    const page = makeJsdomPage([
      {
        selector: '#nav',
        styles: { display: 'flex' },
        children: [{ 'font-size': '14px' }, { 'font-size': '12px' }],
      },
    ]);

    const results = await extractFromPage(
      page as any,
      [{ componentId: 'voc-topbar', selector: '#nav' }],
      { whitelist: WHITELIST, depth: 1 },
    );

    // root + 2 children
    expect(results.filter((r) => !isMissing(r))).toHaveLength(3);
  });

  it('handles multiple targets and partial missing', async () => {
    const page = makeJsdomPage([
      { selector: '#present', styles: { display: 'flex' } },
      // '#missing' is not registered
    ]);

    const results = await extractFromPage(
      page as any,
      [
        { componentId: 'comp-a', selector: '#present' },
        { componentId: 'comp-b', selector: '#missing' },
      ],
      opts,
    );

    expect(results).toHaveLength(2);
    expect(isMissing(results[0])).toBe(false);
    expect(isMissing(results[1])).toBe(true);
  });
});
