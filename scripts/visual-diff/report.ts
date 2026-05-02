/**
 * report.ts — Diff[] → markdown string renderer.
 * Pure function: no I/O, no Playwright. Testable in Vitest.
 */

import type { Diff, Severity } from './diff.js';

export type { Diff };

export interface NotMeasurableEntry {
  componentId: string;
  reason: string;
}

export interface ReportMeta {
  generatedAt: string;
  protoUrl: string;
  reactUrl: string;
  notMeasurable: NotMeasurableEntry[];
  selectorFallbacks: string[];
  sortKeyWarning?: string;
}

export interface TokenHint {
  observed: string;
  closestToken: string;
  deltaE: number;
}

function countBySeverity(diffs: Diff[], componentId: string): Record<Severity, number> {
  const counts: Record<Severity, number> = { HIGH: 0, MED: 0, LOW: 0 };
  for (const d of diffs) {
    if (d.componentId === componentId) counts[d.severity]++;
  }
  return counts;
}

function escapeCell(val: string): string {
  return val.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * renderReport — converts a list of Diff records + metadata into a markdown report string.
 */
export function renderReport(diffs: Diff[], meta: ReportMeta, tokenHints?: TokenHint[]): string {
  const lines: string[] = [];

  lines.push('# VOC Visual Diff — Prototype vs `/voc` (Wave 1.5 Follow-up A, Stage 1 output)');
  lines.push('');
  lines.push(`Generated: ${meta.generatedAt}`);
  lines.push(`Prototype URL: ${meta.protoUrl}`);
  lines.push(`React URL: ${meta.reactUrl}`);
  lines.push('');

  // Sort key warning banner
  if (meta.sortKeyWarning) {
    lines.push(`> ⚠️ ${meta.sortKeyWarning}`);
    lines.push('');
  }

  // NOT MEASURABLE banner
  if (meta.notMeasurable.length > 0) {
    lines.push('> **[NOT MEASURABLE]** The following components could not be extracted:');
    for (const nm of meta.notMeasurable) {
      lines.push(`> - \`${nm.componentId}\`: ${nm.reason}`);
    }
    lines.push('');
  }

  // SELECTOR FALLBACK banner
  if (meta.selectorFallbacks.length > 0) {
    lines.push(
      '> **[SELECTOR FALLBACK]** The following components used structural CSS selectors (Stage 2 will add `data-pcomp` markers):',
    );
    for (const id of meta.selectorFallbacks) {
      lines.push(`> - \`${id}\``);
    }
    lines.push('');
  }

  // Summary table
  const componentIds = [...new Set(diffs.map((d) => d.componentId))];

  lines.push('## Summary');
  lines.push('');
  lines.push('| Component | HIGH | MED | LOW |');
  lines.push('|-----------|------|-----|-----|');

  for (const id of componentIds) {
    const counts = countBySeverity(diffs, id);
    lines.push(`| ${id} | ${counts.HIGH} | ${counts.MED} | ${counts.LOW} |`);
  }

  for (const nm of meta.notMeasurable) {
    if (!componentIds.includes(nm.componentId)) {
      lines.push(`| ${nm.componentId} | — | — | — |`);
    }
  }

  lines.push('');

  // Per-component sections
  for (const id of componentIds) {
    const componentDiffs = diffs.filter((d) => d.componentId === id);
    lines.push(`## ${id}`);
    lines.push('');
    lines.push('| Property | Prototype | React | Severity | Suggested Action |');
    lines.push('|----------|-----------|-------|----------|------------------|');

    for (const d of componentDiffs) {
      const suggestion = d.suggestion ? escapeCell(d.suggestion) : '—';
      lines.push(
        `| ${escapeCell(d.property)} | ${escapeCell(d.prototype)} | ${escapeCell(d.react)} | ${d.severity} | ${suggestion} |`,
      );
    }

    lines.push('');
  }

  // Token Mapping Hints appendix
  if (tokenHints && tokenHints.length > 0) {
    lines.push('## Token Mapping Hints');
    lines.push('');
    lines.push(
      'For each unique React color encountered, the nearest token from `frontend/src/tokens.ts`:',
    );
    lines.push('');
    lines.push('| Observed (React) | Closest token | ΔE (LAB) |');
    lines.push('|------------------|---------------|----------|');

    for (const hint of tokenHints) {
      lines.push(
        `| ${escapeCell(hint.observed)} | \`${escapeCell(hint.closestToken)}\` | ${hint.deltaE.toFixed(1)} |`,
      );
    }

    lines.push('');
  }

  return lines.join('\n');
}
