/**
 * run-diff.ts — orchestrates the visual-diff run: extract → diff → token hints → write report.
 *
 * Extracted from index.ts (SRP: diff orchestration only — no CLI parsing, no
 * screenshot mode handling).
 */

import * as fs from 'fs';
import * as path from 'path';
import { bootHarness } from './harness.js';
import { extractFromPage, isMissing, WHITELIST } from './extract.js';
import { diff } from './diff.js';
import { renderReport } from './report.js';
import { loadTokens, findNearestTokens } from './tokens.js';
import { SELECTOR_MAP, getFallbackBannerComponents } from './selectors.js';
import type { ComponentId } from './selectors.js';
import type { ReportMeta, NotMeasurableEntry } from './report.js';
import { openPrototypeOverlays, openReactOverlays, detectSortKeyMismatch } from './overlays.js';

export interface DiffRunOptions {
  components: ComponentId[];
  resolvedOut: string;
  protoPort: number;
  reactPort: number;
  headed: boolean;
  keepServer: boolean;
  severity: 'HIGH' | 'MED' | 'LOW';
}

export async function runDiff(opts: DiffRunOptions): Promise<void> {
  // Determine which components to process
  const allComponents = SELECTOR_MAP.map((e) => e.componentId);
  const targetComponents: ComponentId[] =
    opts.components.length > 0 ? opts.components : allComponents;

  // Compute fallback list from the FULL selector map (not filtered target list)
  // so the banner always reflects all 9 structural-fallback components when no --component= filter.
  const allFallbackComponents = getFallbackBannerComponents();
  const selectorFallbacks = allFallbackComponents.filter((id) =>
    targetComponents.includes(id as ComponentId),
  );

  console.error(`[visual-diff] Processing ${targetComponents.length} components`);
  console.error(`[visual-diff] Report → ${opts.resolvedOut}`);

  const { protoPage, reactPage, teardown } = await bootHarness({
    protoPort: opts.protoPort,
    reactPort: opts.reactPort,
    headed: opts.headed,
    keepServer: opts.keepServer,
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
    const minSeverity = SEVERITY_ORDER[opts.severity];
    const filteredDiffs = allDiffs.filter((d) => SEVERITY_ORDER[d.severity] <= minSeverity);

    // Token mapping hints
    console.error('[visual-diff] Computing token hints...');
    const tokenHints = await computeTokenHints(filteredDiffs);

    const meta: ReportMeta = {
      generatedAt: new Date().toISOString(),
      protoUrl: `http://127.0.0.1:${opts.protoPort}/prototype.html#page-voc`,
      reactUrl: `http://127.0.0.1:${opts.reactPort}/voc`,
      notMeasurable,
      selectorFallbacks,
      sortKeyWarning,
    };

    // Render and write report
    const markdown = renderReport(filteredDiffs, meta, tokenHints);

    // F9: unconditional mkdirSync with recursive to avoid TOCTOU
    const outDir = path.dirname(opts.resolvedOut);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(opts.resolvedOut, markdown, 'utf-8');

    console.error(`[visual-diff] Report written: ${opts.resolvedOut}`);
    console.error(
      `[visual-diff] Total diffs: ${filteredDiffs.length} (HIGH: ${filteredDiffs.filter((d) => d.severity === 'HIGH').length}, MED: ${filteredDiffs.filter((d) => d.severity === 'MED').length}, LOW: ${filteredDiffs.filter((d) => d.severity === 'LOW').length})`,
    );
  } finally {
    await teardown();
  }
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
