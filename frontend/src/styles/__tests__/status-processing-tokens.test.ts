import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, '..', 'index.css');
const css = readFileSync(cssPath, 'utf8');

const VIOLET_MIN = 285;
const VIOLET_MAX = 295;

const tokens = [
  '--status-processing-bg',
  '--status-processing-fg',
  '--status-processing-border',
] as const;

function hueOf(oklchInner: string): number {
  const parts = oklchInner.trim().split(/\s+/);
  return Number(parts[2]);
}

describe('--status-processing tokens — Wave 1.6 violet move (hue 285°–295°)', () => {
  it.each(tokens)('%s light/dark hue ∈ [285, 295]', (tok) => {
    const decl = new RegExp(
      `${tok}:\\s*light-dark\\(\\s*oklch\\(([^)]+)\\)\\s*,\\s*oklch\\(([^)]+)\\)\\s*\\)`,
      'm',
    );
    const m = css.match(decl);
    expect(m).not.toBeNull();
    const lightInner = m?.[1] ?? '';
    const darkInner = m?.[2] ?? '';
    const lightHue = hueOf(lightInner);
    const darkHue = hueOf(darkInner);
    expect(lightHue).toBeGreaterThanOrEqual(VIOLET_MIN);
    expect(lightHue).toBeLessThanOrEqual(VIOLET_MAX);
    expect(darkHue).toBeGreaterThanOrEqual(VIOLET_MIN);
    expect(darkHue).toBeLessThanOrEqual(VIOLET_MAX);
  });
});
