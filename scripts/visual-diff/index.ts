/**
 * index.ts — CLI entry point for the visual-diff harness.
 * Parses CLI args, then dispatches to either the screenshot runner or the diff runner.
 *
 * Usage: npx tsx scripts/visual-diff.ts [options]
 */

import * as path from 'path';
import * as url from 'url';
import type { ComponentId } from './selectors.js';
import { runScreenshots } from './screenshot.js';
import { runDiff } from './run-diff.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_OUT = path.join(
  ROOT,
  'docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md',
);

interface CliArgs {
  components: ComponentId[];
  out: string;
  keepServer: boolean;
  protoPort: number;
  reactPort: number;
  headed: boolean;
  severity: 'HIGH' | 'MED' | 'LOW';
  screenshots: boolean;
}

/** Hand-rolled CLI arg parser — no external deps. */
function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {
    components: [],
    out: DEFAULT_OUT,
    keepServer: false,
    protoPort: 4174,
    reactPort: 5173,
    headed: false,
    severity: 'LOW',
    screenshots: false,
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
    } else if (arg === '--screenshots') {
      result.screenshots = true;
    }
  }

  return result;
}

export async function main(argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  // --screenshots: delegate entirely to screenshot module, then exit
  if (args.screenshots) {
    const result = await runScreenshots({
      protoPort: args.protoPort,
      reactPort: args.reactPort,
      headed: args.headed,
      keepServer: args.keepServer,
    });
    console.error(
      `[visual-diff] Screenshots complete. ${result.captured.length} captured, ${result.skipped.length} skipped.`,
    );
    if (result.skipped.length > 0) {
      console.error(`[visual-diff] Skipped: ${result.skipped.join(', ')}`);
    }
    return;
  }

  // F7: path traversal guard — resolve and assert within repo root
  const resolvedOut = path.resolve(args.out);
  if (!resolvedOut.startsWith(ROOT + path.sep) && resolvedOut !== ROOT) {
    process.stderr.write(
      `[visual-diff] ERROR: --out path "${resolvedOut}" is outside repo root "${ROOT}". Aborting.\n`,
    );
    process.exit(1);
  }

  await runDiff({
    components: args.components,
    resolvedOut,
    protoPort: args.protoPort,
    reactPort: args.reactPort,
    headed: args.headed,
    keepServer: args.keepServer,
    severity: args.severity,
  });
}
