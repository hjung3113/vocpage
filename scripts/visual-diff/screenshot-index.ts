/**
 * screenshot-index.ts — markdown index writer for screenshot runs.
 *
 * Extracted from screenshot.ts (SRP: report generation only — no capture logic).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { SELECTOR_MAP } from './selectors.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

/**
 * generateMarkdownIndex — writes voc-visual-screenshots.md next to the screenshots dir.
 * Uses HTML <img width="600"> in a 2-cell table so side-by-side renders on GitHub.
 */
export function generateMarkdownIndex(
  outDir: string,
  captured: string[],
  runTimestamp: string,
): string {
  const reviewDir = path.dirname(outDir);
  const indexPath = path.join(reviewDir, 'voc-visual-screenshots.md');

  const capturedSet = new Set(captured.map((p) => path.basename(p)));

  function imgTag(filename: string): string {
    if (capturedSet.has(filename)) {
      return `<img src="screenshots/${filename}" width="600" alt="${filename}">`;
    }
    return `_not captured_`;
  }

  const lines: string[] = [
    '# VOC Visual Screenshots — Stage 3',
    '',
    '## How to read this',
    '',
    'Left = prototype, right = /voc React. Diffs that the visual-diff harness flags HIGH are unsurprising; ' +
      'what we want from this stage are *visible-but-uncaught* gaps — wrong icon stroke width, missing border radius, ' +
      'missing inset shadow, missing badge dot, etc.',
    '',
    '## Captured viewports',
    '',
    '| Viewport | Files |',
    '|----------|-------|',
    '| 1280 × 900 | per-component + full-page |',
    '| 1440 × 900 | full-page only |',
    '',
    `**Run timestamp:** ${runTimestamp}`,
    '',
    '---',
    '',
  ];

  // Per-component sections
  for (const entry of SELECTOR_MAP) {
    const { componentId } = entry;
    lines.push(`## ${componentId}`);
    lines.push('');
    lines.push('| Prototype | React |');
    lines.push('|-----------|-------|');
    lines.push(`| ${imgTag(`${componentId}-proto.png`)} | ${imgTag(`${componentId}-react.png`)} |`);
    lines.push('');
  }

  // Full-page sections
  lines.push('## Full page — 1280 × 900');
  lines.push('');
  lines.push('| Prototype | React |');
  lines.push('|-----------|-------|');
  lines.push(`| ${imgTag('full-1280-proto.png')} | ${imgTag('full-1280-react.png')} |`);
  lines.push('');

  lines.push('## Full page — 1440 × 900');
  lines.push('');
  lines.push('| Prototype | React |');
  lines.push('|-----------|-------|');
  lines.push(`| ${imgTag('full-1440-proto.png')} | ${imgTag('full-1440-react.png')} |`);
  lines.push('');

  const content = lines.join('\n');
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.error(`[screenshot] Index written: ${path.relative(ROOT, indexPath)}`);
  return indexPath;
}
