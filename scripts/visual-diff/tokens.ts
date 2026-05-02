/**
 * tokens.ts — load frontend/src/tokens.ts at runtime and build LAB nearest-neighbour
 * for the Token Mapping Hints appendix in the report.
 */

import { createRequire } from 'module';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

export interface TokenEntry {
  name: string; // e.g. 'bgApp'
  cssVar: string; // e.g. 'var(--bg-app)'
  oklch: string; // raw OKLCH string from tokens.ts
}

export interface TokenHintResult {
  observed: string;
  closestToken: string;
  deltaE: number;
}

/** Load token entries from frontend/src/tokens.ts via dynamic import. */
export async function loadTokens(): Promise<TokenEntry[]> {
  const tokensPath = path.join(ROOT, 'frontend', 'src', 'tokens.ts');

  // Use tsx-compatible dynamic import
  const mod = await import(tokensPath);
  const tokens = mod.tokens as Record<string, string>;

  return Object.entries(tokens).map(([key, value]) => ({
    name: key,
    cssVar: `var(--${camelToKebab(key)})`,
    oklch: value,
  }));
}

/** Convert camelCase token key to kebab-case CSS var name. */
function camelToKebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Parse an OKLCH string like "oklch(63% 0.19 258)" into [L, C, H].
 * Returns null if not parseable.
 */
function parseOklch(val: string): [number, number, number] | null {
  const m = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/.exec(val);
  if (!m) return null;
  return [parseFloat(m[1]) / 100, parseFloat(m[2]), parseFloat(m[3])];
}

/**
 * Parse an rgb string like "rgb(94, 102, 210)" or "rgba(94, 102, 210, 1)"
 * into [r, g, b] in 0–255 range. Returns null if not parseable.
 */
function parseRgb(val: string): [number, number, number] | null {
  const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(val);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

/** Convert linear RGB (0–1) to XYZ D65 */
function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Convert sRGB (0–255) to CIELAB */
function rgbToLab(rgb: [number, number, number]): [number, number, number] {
  const r = linearize(rgb[0] / 255);
  const g = linearize(rgb[1] / 255);
  const b = linearize(rgb[2] / 255);

  // sRGB to XYZ D65
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  // Normalize by D65 white point
  const xn = x / 0.95047,
    yn = y / 1.0,
    zn = z / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const L = 116 * f(yn) - 16;
  const a = 500 * (f(xn) - f(yn));
  const bv = 200 * (f(yn) - f(zn));
  return [L, a, bv];
}

/** CIELAB ΔE76 distance */
function deltaE(lab1: [number, number, number], lab2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
      Math.pow(lab1[1] - lab2[1], 2) +
      Math.pow(lab1[2] - lab2[2], 2),
  );
}

/**
 * Convert OKLCH to approximate RGB for nearest-neighbour comparison.
 * This is a rough conversion for heuristic purposes only.
 */
function oklchToRgb(lch: [number, number, number]): [number, number, number] {
  const [L, C, H] = lch;
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab to linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bv = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // Clamp and convert to 0–255
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const toSrgb = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

  return [
    Math.round(toSrgb(clamp(r)) * 255),
    Math.round(toSrgb(clamp(g)) * 255),
    Math.round(toSrgb(clamp(bv)) * 255),
  ];
}

/**
 * findNearestToken — given a list of observed RGB colors from the React side,
 * return the closest token for each using LAB nearest-neighbour search.
 */
export function findNearestTokens(
  observedColors: string[],
  tokens: TokenEntry[],
): TokenHintResult[] {
  // Precompute token LAB values
  const tokenLabs: Array<{ entry: TokenEntry; lab: [number, number, number] }> = [];
  for (const entry of tokens) {
    const parsed = parseOklch(entry.oklch);
    if (!parsed) continue;
    const rgb = oklchToRgb(parsed);
    const lab = rgbToLab(rgb);
    tokenLabs.push({ entry, lab });
  }

  const results: TokenHintResult[] = [];

  for (const observed of observedColors) {
    const rgb = parseRgb(observed);
    if (!rgb) continue;

    const observedLab = rgbToLab(rgb);
    let closest: TokenEntry | null = null;
    let minDelta = Infinity;

    for (const { entry, lab } of tokenLabs) {
      const d = deltaE(observedLab, lab);
      if (d < minDelta) {
        minDelta = d;
        closest = entry;
      }
    }

    if (closest) {
      results.push({
        observed,
        closestToken: closest.cssVar,
        deltaE: minDelta,
      });
    }
  }

  return results;
}
