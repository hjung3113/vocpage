/**
 * extract.ts — in-page computed style extraction.
 * Pure adapter: accepts a Playwright Page (or a compatible mock for tests).
 * All browser interaction is isolated in the `evaluate` call.
 */

import type { Extracted } from './diff.js';

export type { Extracted };

/** Sentinel emitted when a target's selector finds no element in the DOM. */
export interface MissingExtracted {
  componentId: string;
  selector: string;
  status: 'MISSING';
}

export type ExtractResult = Extracted | MissingExtracted;

export function isMissing(e: ExtractResult): e is MissingExtracted {
  return (e as MissingExtracted).status === 'MISSING';
}

export interface ExtractOptions {
  whitelist: readonly string[];
  depth: 0 | 1;
}

export interface PageLike {
  evaluate<T>(fn: (args: unknown) => T, args?: unknown): Promise<T>;
}

/** Ordered whitelist of computed CSS properties to extract. */
export const WHITELIST: readonly string[] = [
  // Typography
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-transform',
  // Color
  'color',
  'background-color',
  'border-color',
  'outline-color',
  // Spacing
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'gap',
  'row-gap',
  'column-gap',
  // Border
  'border-top-width',
  'border-radius',
  'border-style',
  // Shadow
  'box-shadow',
  // Layout
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'flex-wrap',
  'grid-template-columns',
  // Sizing (only non-auto/none values are useful; harness post-filters)
  'width',
  'height',
  'min-width',
  'max-width',
] as const;

/** Selector for each data-pcomp component, with structural fallback. */
interface ExtractTarget {
  componentId: string;
  /** CSS selector to locate the root element */
  selector: string;
}

/**
 * extractFromPage — run getComputedStyle for all data-pcomp elements
 * (and optionally their first-level children) on a given page.
 *
 * Accepts any object with an `evaluate` method (Playwright Page or mock).
 *
 * Note: we pass args via a separate arg object to avoid tsx/__name compilation
 * issues when the function body is serialized for the browser context.
 */
export async function extractFromPage(
  page: PageLike,
  targets: ExtractTarget[],
  opts: ExtractOptions,
): Promise<ExtractResult[]> {
  const whitelist = Array.from(opts.whitelist);
  const depth = opts.depth;

  // Build the browser-side function as a string to avoid tsx __name() helper injection.
  // Playwright serializes this and evals it in the browser context.
  const browserFnSrc = `function extractStyles(arg) {
    var targets = arg.targets;
    var whitelist = arg.whitelist;
    var depth = arg.depth;
    var whitelistSet = new Set(whitelist);
    var SKIP_VALUES = new Set(['auto', 'none', 'normal']);
    var SIZING_PROPS = new Set(['width', 'height', 'min-width', 'max-width']);
    var extracted = [];

    function getProps(el) {
      var cs = window.getComputedStyle(el);
      var props = {};
      for (var i = 0; i < whitelist.length; i++) {
        var prop = whitelist[i];
        var val = cs.getPropertyValue(prop).trim();
        if (!val) continue;
        if (SIZING_PROPS.has(prop) && SKIP_VALUES.has(val)) continue;
        if (whitelistSet.has(prop)) props[prop] = val;
      }
      return props;
    }

    for (var t = 0; t < targets.length; t++) {
      var target = targets[t];
      var el = document.querySelector(target.selector);
      if (!el) {
        // Emit a sentinel instead of silently skipping
        extracted.push({
          componentId: target.componentId,
          selector: target.selector,
          status: 'MISSING',
        });
        continue;
      }

      extracted.push({
        componentId: target.componentId,
        selector: target.selector,
        role: 'root',
        props: getProps(el),
      });

      if (depth >= 1) {
        var children = Array.prototype.slice.call(el.children, 0, 10);
        for (var c = 0; c < children.length; c++) {
          extracted.push({
            componentId: target.componentId,
            selector: target.selector + ' > :nth-child(' + (c + 1) + ')',
            role: 'child',
            props: getProps(children[c]),
          });
        }
      }
    }
    return extracted;
  }`;

  // eslint-disable-next-line no-new-func
  const browserFn = new Function(`return (${browserFnSrc})`)() as (arg: {
    targets: ExtractTarget[];
    whitelist: string[];
    depth: number;
  }) => ExtractResult[];

  const results = await page.evaluate(browserFn, { targets, whitelist, depth } as unknown);

  return results as ExtractResult[];
}
