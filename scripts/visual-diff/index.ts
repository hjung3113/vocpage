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
import { extractFromPage, isMissing, WHITELIST } from './extract.js';
import { diff } from './diff.js';
import { renderReport } from './report.js';
import { loadTokens, findNearestTokens } from './tokens.js';
import { SELECTOR_MAP, getFallbackBannerComponents } from './selectors.js';
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

  // F7: path traversal guard — resolve and assert within repo root
  const resolvedOut = path.resolve(args.out);
  if (!resolvedOut.startsWith(ROOT + path.sep) && resolvedOut !== ROOT) {
    process.stderr.write(
      `[visual-diff] ERROR: --out path "${resolvedOut}" is outside repo root "${ROOT}". Aborting.\n`,
    );
    process.exit(1);
  }

  // Determine which components to process
  const allComponents = SELECTOR_MAP.map((e) => e.componentId);
  const targetComponents: ComponentId[] =
    args.components.length > 0 ? args.components : allComponents;

  // Compute fallback list from the FULL selector map (not filtered target list)
  // so the banner always reflects all 9 structural-fallback components when no --component= filter.
  const allFallbackComponents = getFallbackBannerComponents();
  const selectorFallbacks = allFallbackComponents.filter((id) =>
    targetComponents.includes(id as ComponentId),
  );

  console.error(`[visual-diff] Processing ${targetComponents.length} components`);
  console.error(`[visual-diff] Report → ${resolvedOut}`);

  const { protoPage, reactPage, teardown } = await bootHarness({
    protoPort: args.protoPort,
    reactPort: args.reactPort,
    headed: args.headed,
    keepServer: args.keepServer,
  });

  try {
    const notMeasurable: NotMeasurableEntry[] = [];

    // Build extraction targets for prototype
    const protoTargets = targetComponents
      .filter((id) => SELECTOR_MAP.find((e) => e.componentId === id))
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
    await openPrototypeOverlays(protoPage);
    await openReactOverlays(reactPage);

    // Extract computed styles
    console.error('[visual-diff] Extracting prototype styles...');
    const protoRaw = await extractFromPage(protoPage, protoTargets, {
      whitelist: WHITELIST,
      depth: 1,
    });

    console.error('[visual-diff] Extracting React styles...');
    const reactRaw = await extractFromPage(reactPage, reactTargets, {
      whitelist: WHITELIST,
      depth: 1,
    });

    // F1: Collect missing sentinels from both sides and emit NotMeasurableEntry per component
    const protoMissingIds = new Set<string>();
    const reactMissingIds = new Set<string>();

    for (const e of protoRaw) {
      if (isMissing(e)) protoMissingIds.add(e.componentId);
    }
    for (const e of reactRaw) {
      if (isMissing(e)) reactMissingIds.add(e.componentId);
    }

    // Union of all components that are missing on at least one side
    const allMissingIds = new Set([...protoMissingIds, ...reactMissingIds]);
    for (const id of allMissingIds) {
      const protoMissing = protoMissingIds.has(id);
      const reactMissing = reactMissingIds.has(id);
      let reason: string;
      if (protoMissing && reactMissing) {
        reason = 'Selector not found on both prototype and React sides';
      } else if (protoMissing) {
        reason = 'Selector not found on prototype side';
      } else {
        reason = 'Selector not found on React side';
      }
      notMeasurable.push({ componentId: id, reason });
    }

    // Filter to only successfully extracted entries for diff
    const protoExtracted = protoRaw.filter((e) => !isMissing(e)) as import('./diff.js').Extracted[];
    const reactExtracted = reactRaw.filter((e) => !isMissing(e)) as import('./diff.js').Extracted[];

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

    const meta: ReportMeta = {
      generatedAt: new Date().toISOString(),
      protoUrl: `http://127.0.0.1:${args.protoPort}/prototype.html#page-voc`,
      reactUrl: `http://127.0.0.1:${args.reactPort}/voc`,
      notMeasurable,
      selectorFallbacks,
      sortKeyWarning,
    };

    // Render and write report
    const markdown = renderReport(filteredDiffs, meta, tokenHints);

    // F9: unconditional mkdirSync with recursive to avoid TOCTOU
    const outDir = path.dirname(resolvedOut);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(resolvedOut, markdown, 'utf-8');

    console.error(`[visual-diff] Report written: ${resolvedOut}`);
    console.error(
      `[visual-diff] Total diffs: ${filteredDiffs.length} (HIGH: ${filteredDiffs.filter((d) => d.severity === 'HIGH').length}, MED: ${filteredDiffs.filter((d) => d.severity === 'MED').length}, LOW: ${filteredDiffs.filter((d) => d.severity === 'LOW').length})`,
    );
  } finally {
    await teardown();
  }
}

async function openPrototypeOverlays(page: import('playwright').Page): Promise<void> {
  // Wait for globals to be attached
  try {
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).openModal === 'function',
      { timeout: 5_000 },
    );
  } catch {
    console.error('[harness] Warning: window.openModal not available within 5s');
  }

  // Open voc-create-modal
  try {
    await page.evaluate(() => {
      (window as unknown as Record<string, () => void>).openModal?.();
    });
    await page.waitForSelector('#modalBg', { state: 'visible', timeout: 5_000 });
    console.error('[harness] Proto overlay: #modalBg visible');
  } catch (e) {
    console.error('[harness] Warning: failed to open proto modal:', e);
  }

  // Open voc-notif-dropdown
  try {
    const notifBtn = await page.$('#notifBtn');
    if (notifBtn) {
      await notifBtn.click();
      await page.waitForSelector('#notifPanel', { state: 'visible', timeout: 5_000 });
      console.error('[harness] Proto overlay: #notifPanel visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open proto notif panel:', e);
  }
}

async function openReactOverlays(page: import('playwright').Page): Promise<void> {
  // Open voc-create-modal
  try {
    const createBtn = await page.$('button:has-text("새 VOC 등록")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForSelector('[data-pcomp="voc-create-modal"]', {
        state: 'visible',
        timeout: 8_000,
      });
      console.error('[harness] React overlay: voc-create-modal visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open react create modal:', e);
  }

  // Open voc-notif-dropdown
  try {
    const bellBtn = await page.$('[data-pcomp="notification-bell"]');
    if (bellBtn) {
      await bellBtn.click();
      await page.waitForSelector('[data-pcomp="voc-notif-dropdown"]', {
        state: 'visible',
        timeout: 5_000,
      });
      console.error('[harness] React overlay: voc-notif-dropdown visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open react notif dropdown:', e);
  }

  // Open voc-review-drawer by clicking first table row
  try {
    const firstRow = await page.$('thead[data-pcomp="data-table"] ~ tbody tr');
    if (firstRow) {
      await firstRow.click();
      await page.waitForSelector('[data-pcomp="voc-review-drawer"]', {
        state: 'visible',
        timeout: 8_000,
      });
      console.error('[harness] React overlay: voc-review-drawer visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open react review drawer:', e);
  }
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
