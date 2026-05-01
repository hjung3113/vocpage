/**
 * diff.ts — pure comparison functions for visual-diff harness.
 * No Playwright, no side effects. All logic is testable in Vitest/jsdom.
 */

export type Severity = 'HIGH' | 'MED' | 'LOW';

export interface Extracted {
  componentId: string;
  selector: string;
  role: 'root' | 'child';
  props: Record<string, string>;
}

export interface Diff {
  componentId: string;
  selector: string;
  property: string;
  prototype: string;
  react: string;
  severity: Severity;
  suggestion?: string;
}

// Property group classification
const COLOR_PROPS = new Set(['color', 'background-color', 'border-color', 'outline-color']);

const SPACING_PROPS = new Set([
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
  'border-top-width',
  'border-radius',
  'width',
  'height',
  'min-width',
  'max-width',
]);

const LAYOUT_PROPS = new Set([
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'flex-wrap',
  'grid-template-columns',
]);

const TYPOGRAPHY_EXACT_PROPS = new Set([
  'font-weight',
  'text-transform',
  'letter-spacing',
  'border-style',
]);

const TYPOGRAPHY_APPROX_PROPS = new Set(['font-size', 'line-height']);

const SHADOW_PROPS = new Set(['box-shadow']);

/** Parse a px value like "14px" or "14.3px" → number, or NaN if not parseable */
function parsePx(val: string): number {
  const m = /^(-?[\d.]+)px$/.exec(val.trim());
  return m ? parseFloat(m[1]) : NaN;
}

/** Normalize whitespace for shadow comparison */
function normalizeShadow(val: string): string {
  return val.replace(/\s+/g, ' ').trim();
}

/**
 * compareFontFamily — normalizes two font-family strings and returns true if
 * they match or one stack is a prefix of the other (handles Tailwind v4 vs prototype stack differences).
 * Normalization: lowercase, strip quotes, split on comma, trim each entry.
 */
export function compareFontFamily(a: string, b: string): boolean {
  function normalize(v: string): string[] {
    return v
      .toLowerCase()
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''));
  }
  const stackA = normalize(a);
  const stackB = normalize(b);
  if (stackA.length === 0 || stackB.length === 0) return false;
  // Check if one stack is a prefix of the other
  const shorter = stackA.length <= stackB.length ? stackA : stackB;
  const longer = stackA.length <= stackB.length ? stackB : stackA;
  return shorter.every((font, i) => font === longer[i]);
}

/**
 * classify — determine if two computed values for a given property match,
 * and what severity the mismatch is if they don't.
 */
export function classify(
  prop: string,
  av: string,
  bv: string,
): { match: boolean; severity: Severity } {
  const a = av.trim();
  const b = bv.trim();

  if (a === b) return { match: true, severity: 'LOW' };

  if (COLOR_PROPS.has(prop)) {
    return { match: false, severity: 'HIGH' };
  }

  if (LAYOUT_PROPS.has(prop)) {
    return { match: false, severity: 'HIGH' };
  }

  if (SPACING_PROPS.has(prop)) {
    const pxA = parsePx(a);
    const pxB = parsePx(b);
    if (!isNaN(pxA) && !isNaN(pxB) && Math.abs(pxA - pxB) <= 1) {
      return { match: true, severity: 'MED' };
    }
    return { match: false, severity: 'MED' };
  }

  if (prop === 'font-family') {
    return compareFontFamily(a, b)
      ? { match: true, severity: 'MED' }
      : { match: false, severity: 'MED' };
  }

  if (TYPOGRAPHY_EXACT_PROPS.has(prop)) {
    return { match: false, severity: 'MED' };
  }

  if (TYPOGRAPHY_APPROX_PROPS.has(prop)) {
    const pxA = parsePx(a);
    const pxB = parsePx(b);
    if (!isNaN(pxA) && !isNaN(pxB) && Math.abs(pxA - pxB) <= 1.5) {
      return { match: true, severity: 'MED' };
    }
    return { match: false, severity: 'MED' };
  }

  if (SHADOW_PROPS.has(prop)) {
    if (normalizeShadow(a) === normalizeShadow(b)) {
      return { match: true, severity: 'LOW' };
    }
    return { match: false, severity: 'LOW' };
  }

  // Unknown property — treat as exact, LOW severity
  return { match: false, severity: 'LOW' };
}

const SEVERITY_ORDER: Record<Severity, number> = { HIGH: 0, MED: 1, LOW: 2 };

/**
 * diff — compare two arrays of Extracted (prototype vs react) and return
 * a sorted list of Diff records for all mismatches.
 */
export function diff(protoExtracted: Extracted[], reactExtracted: Extracted[]): Diff[] {
  // Pair root entries by componentId. Children (depth>=1) are skipped because
  // proto/react DOM trees diverge in child ordering and pairing by index is unreliable.
  const reactMap = new Map<string, Extracted>();
  for (const e of reactExtracted) {
    if (e.role !== 'root') continue;
    reactMap.set(e.componentId, e);
  }

  const results: Diff[] = [];

  for (const protoEntry of protoExtracted) {
    if (protoEntry.role !== 'root') continue;
    const reactEntry = reactMap.get(protoEntry.componentId);
    if (!reactEntry) continue; // no matching pair — skip

    for (const [prop, protoVal] of Object.entries(protoEntry.props)) {
      const reactVal = reactEntry.props[prop];
      if (reactVal === undefined) continue; // prop not extracted on react side

      const { match, severity } = classify(prop, protoVal, reactVal);
      if (!match) {
        results.push({
          componentId: protoEntry.componentId,
          selector: protoEntry.selector,
          property: prop,
          prototype: protoVal,
          react: reactVal,
          severity,
        });
      }
    }
  }

  // Sort: componentId asc, severity desc, property asc
  results.sort((a, b) => {
    if (a.componentId !== b.componentId) return a.componentId.localeCompare(b.componentId);
    const sd = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sd !== 0) return sd;
    return a.property.localeCompare(b.property);
  });

  return results;
}
