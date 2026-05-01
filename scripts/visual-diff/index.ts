/**
 * index.ts — CLI entry point and orchestration for visual-diff harness.
 * Parses CLI args, boots harness, runs extraction + diff + report, writes file.
 *
 * Usage: npx tsx scripts/visual-diff.ts [options]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { bootHarness } from './harness.js';
import { extractFromPage, WHITELIST } from './extract.js';
import { diff } from './diff.js';
import { renderReport } from './report.js';
import { loadTokens, findNearestTokens } from './tokens.js';
import { SELECTOR_MAP, getFallbackComponents } from './selectors.js';
import type { ComponentId } from './selectors.js';
import type { ReportMeta, NotMeasurableEntry } from './report.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_OUT = path.join(
  ROOT,
  'docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md',
);

/** Hand-rolled CLI arg parser — no external deps. */
function parseArgs(argv: string[]): {
  components: ComponentId[];
  out: string;
  keepServer: boolean;
  protoPort: number;
  reactPort: number;
  headed: boolean;
  severity: 'HIGH' | 'MED' | 'LOW';
} {
  const result = {
    components: [] as ComponentId[],
    out: DEFAULT_OUT,
    keepServer: false,
    protoPort: 4174,
    reactPort: 5173,
    headed: false,
    severity: 'LOW' as 'HIGH' | 'MED' | 'LOW',
  };

  for (const arg of argv) {
    if (arg.startsWith('--component=')) {
      result.components.push(arg.slice('--component='.length) as ComponentId);
    } else if (arg.startsWith('--out=')) {
      result.out = arg.slice('--out='.length);
    } else if (arg === '--keep-server') {
      result.keepServer = true;
    } else if (arg.startsWith('--proto-port=')) {
      result.protoPort = parseInt(arg.slice('--proto-port='.length), 10);
    } else if (arg.startsWith('--react-port=')) {
      result.reactPort = parseInt(arg.slice('--react-port='.length), 10);
    } else if (arg === '--headed' || arg === '--headed=true') {
      result.headed = true;
    } else if (arg.startsWith('--severity=')) {
      result.severity = arg.slice('--severity='.length) as 'HIGH' | 'MED' | 'LOW';
    }
  }

  return result;
}

export async function main(argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  // Determine which components to process
  const allComponents = SELECTOR_MAP.map((e) => e.componentId);
  const targetComponents: ComponentId[] =
    args.components.length > 0 ? args.components : allComponents;

  const fallbackComponents = getFallbackComponents();

  console.error(`[visual-diff] Processing ${targetComponents.length} components`);
  console.error(`[visual-diff] Report → ${args.out}`);

  const { protoPage, reactPage, teardown } = await bootHarness({
    protoPort: args.protoPort,
    reactPort: args.reactPort,
    headed: args.headed,
    keepServer: args.keepServer,
  });

  try {
    const notMeasurable: NotMeasurableEntry[] = [];
    const selectorFallbacks: string[] = [];

    // Build extraction targets for prototype
    const protoTargets = targetComponents
      .filter((id) => {
        const entry = SELECTOR_MAP.find((e) => e.componentId === id);
        if (!entry) return false;
        if (fallbackComponents.includes(id)) selectorFallbacks.push(id);
        return true;
      })
      .map((id) => {
        const entry = SELECTOR_MAP.find((e) => e.componentId === id)!;
        return { componentId: id, selector: entry.proto };
      });

    // Build extraction targets for React
    const reactTargets = targetComponents
      .filter((id) => SELECTOR_MAP.find((e) => e.componentId === id))
      .map((id) => {
        const entry = SELECTOR_MAP.find((e) => e.componentId === id)!;
        return { componentId: id, selector: entry.react };
      });

    // --- Handle modal/dropdown/drawer interactions before extraction ---
    // Prototype: open modal, notif dropdown (wait for globals to be available)
    await openPrototypeOverlays(protoPage);

    // React: open create modal and notif dropdown if present
    await openReactOverlays(reactPage);

    // Extract computed styles
    console.error('[visual-diff] Extracting prototype styles...');
    const protoExtracted = await extractFromPage(protoPage, protoTargets, {
      whitelist: WHITELIST,
      depth: 1,
    });

    console.error('[visual-diff] Extracting React styles...');
    const reactExtracted = await extractFromPage(reactPage, reactTargets, {
      whitelist: WHITELIST,
      depth: 1,
    });

    // Check for empty voc-table (MSW guard)
    const protoTableEntry = protoExtracted.find(
      (e) => e.componentId === 'voc-table' && e.role === 'root',
    );
    if (protoTableEntry && Object.keys(protoTableEntry.props).length === 0) {
      notMeasurable.push({ componentId: 'voc-table', reason: 'list empty' });
    }

    // Determine sort key parity warning
    const sortKeyWarning = await detectSortKeyMismatch(protoPage, reactPage);

    // Compute diffs
    console.error('[visual-diff] Computing diffs...');
    const allDiffs = diff(protoExtracted, reactExtracted);

    // Filter by severity if requested
    const SEVERITY_ORDER = { HIGH: 0, MED: 1, LOW: 2 };
    const minSeverity = SEVERITY_ORDER[args.severity];
    const filteredDiffs = allDiffs.filter((d) => SEVERITY_ORDER[d.severity] <= minSeverity);

    // Token mapping hints
    console.error('[visual-diff] Computing token hints...');
    const tokenHints = await computeTokenHints(filteredDiffs);

    // Build unique list of fallbacks actually encountered
    const uniqueFallbacks = [...new Set(selectorFallbacks)].filter((id) =>
      targetComponents.includes(id as ComponentId),
    );

    const meta: ReportMeta = {
      generatedAt: new Date().toISOString(),
      protoUrl: `http://127.0.0.1:${args.protoPort}/prototype.html#page-voc`,
      reactUrl: `http://127.0.0.1:${args.reactPort}/voc`,
      notMeasurable,
      selectorFallbacks: uniqueFallbacks,
      sortKeyWarning,
    };

    // Render and write report
    const markdown = renderReport(filteredDiffs, meta, tokenHints);

    const outDir = path.dirname(args.out);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(args.out, markdown, 'utf-8');

    console.error(`[visual-diff] Report written: ${args.out}`);
    console.error(
      `[visual-diff] Total diffs: ${filteredDiffs.length} (HIGH: ${filteredDiffs.filter((d) => d.severity === 'HIGH').length}, MED: ${filteredDiffs.filter((d) => d.severity === 'MED').length}, LOW: ${filteredDiffs.filter((d) => d.severity === 'LOW').length})`,
    );
  } finally {
    await teardown();
  }
}

async function openPrototypeOverlays(page: import('playwright').Page): Promise<void> {
  // Wait for globals to be attached (per plan decision #3)
  const globalsReady = await page
    .evaluate(() => {
      return typeof (window as unknown as Record<string, unknown>).openModal === 'function';
    })
    .catch(() => false);

  if (!globalsReady) {
    try {
      await page.waitForFunction(
        () => typeof (window as unknown as Record<string, unknown>).openModal === 'function',
        { timeout: 5_000 },
      );
    } catch {
      console.error('[harness] Warning: window.openModal not available within 5s');
    }
  }

  // We don't open overlays by default during bulk extraction to avoid DOM interference.
  // The modal/drawer will be opened only when extracting those specific components.
}

async function openReactOverlays(_page: import('playwright').Page): Promise<void> {
  // React overlays are driven via click simulation during row-level extraction.
  // No-op in Stage 1 bulk extraction pass.
}

async function detectSortKeyMismatch(
  protoPage: import('playwright').Page,
  reactPage: import('playwright').Page,
): Promise<string | undefined> {
  try {
    const protoSort = await protoPage.evaluate(() => {
      const active = document.querySelector('.sort-active, .sort-chip.active, [aria-sort]');
      return active?.textContent?.trim() ?? 'unknown';
    });

    const reactSort = await reactPage.evaluate(() => {
      const active = document.querySelector(
        '[data-active="true"], [aria-sort="descending"], [aria-sort="ascending"]',
      );
      return active?.textContent?.trim() ?? 'unknown';
    });

    if (protoSort !== reactSort) {
      return `Default sort key differs: prototype=\`${protoSort}\`, react=\`${reactSort}\``;
    }
  } catch {
    // Non-critical — don't fail the harness
  }
  return undefined;
}

async function computeTokenHints(
  diffs: import('./diff.js').Diff[],
): Promise<import('./report.js').TokenHint[]> {
  try {
    // Collect unique React color values from diffs
    const colorProps = new Set(['color', 'background-color', 'border-color', 'outline-color']);
    const observedColors = [
      ...new Set(diffs.filter((d) => colorProps.has(d.property)).map((d) => d.react)),
    ];

    if (observedColors.length === 0) return [];

    const tokens = await loadTokens();
    return findNearestTokens(observedColors, tokens);
  } catch (e) {
    console.error('[visual-diff] Warning: token hint computation failed:', e);
    return [];
  }
}
