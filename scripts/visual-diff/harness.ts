/**
 * harness.ts — Playwright setup: spawns http-server + Vite dev server,
 * launches Chromium, performs login flow for React side.
 *
 * All spawned processes are tracked in a Disposable[] and torn down on exit.
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as url from 'url';
import { chromium, Browser, Page } from 'playwright';
import { waitForPort } from './tcp-probe.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

export interface HarnessOptions {
  protoPort?: number;
  reactPort?: number;
  headed?: boolean;
  keepServer?: boolean;
}

export interface HarnessHandles {
  protoPage: Page;
  reactPage: Page;
  teardown(): Promise<void>;
}

interface Disposable {
  kill(): void;
}

// F4: Signal handler registry — registered once at module init, delegates to per-call fns.
type TeardownFn = () => void;
const teardownRegistry: TeardownFn[] = [];

function runAllTeardowns(): void {
  for (const fn of teardownRegistry) {
    try {
      fn();
    } catch (e) {
      process.stderr.write(`[visual-diff] teardown error: ${e}\n`);
    }
  }
  teardownRegistry.length = 0;
}

process.once('exit', runAllTeardowns);
process.once('SIGINT', () => {
  runAllTeardowns();
  process.exit(130);
});
process.once('SIGTERM', () => {
  runAllTeardowns();
  process.exit(143);
});

function spawnProcess(
  cmd: string,
  args: string[],
  opts: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    label: string;
  },
  disposables: Disposable[],
): ChildProcess {
  const child = spawn(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    env: opts.env ?? process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (data: Buffer) => process.stderr.write(`[${opts.label}] ${data}`));
  child.stderr?.on('data', (data: Buffer) => process.stderr.write(`[${opts.label}:err] ${data}`));

  disposables.push({
    kill: () => {
      try {
        child.kill('SIGTERM');
      } catch (e) {
        // F9: log instead of silently swallowing
        process.stderr.write(`[visual-diff] Warning: failed to kill ${opts.label}: ${e}\n`);
      }
    },
  });
  return child;
}

/**
 * bootHarness — starts prototype http-server + Vite dev server, launches Playwright
 * Chromium, and returns page handles for each surface.
 */
export async function bootHarness(opts: HarnessOptions = {}): Promise<HarnessHandles> {
  const protoPort = opts.protoPort ?? 4174;
  const reactPort = opts.reactPort ?? 5173;

  // F4: disposables is local to this call, not module-level
  const disposables: Disposable[] = [];

  const teardown = async () => {
    if (opts.keepServer) {
      const pids = disposables.map((_, i) => `[${i}]`).join(', ');
      console.error(`[harness] --keep-server: leaving processes running. PIDs: ${pids}`);
      return;
    }
    for (const d of [...disposables].reverse()) {
      d.kill();
    }
    disposables.length = 0;
    // Remove from registry so it isn't called again on process exit
    const idx = teardownRegistry.indexOf(syncTeardown);
    if (idx !== -1) teardownRegistry.splice(idx, 1);
  };

  // Synchronous wrapper for the signal handler registry
  const syncTeardown: TeardownFn = () => {
    teardown().catch((e) => {
      process.stderr.write(`[visual-diff] async teardown error: ${e}\n`);
    });
  };

  // F5: Register teardown BEFORE launching anything so signals during boot are handled
  teardownRegistry.push(syncTeardown);

  try {
    // --- Spawn prototype server ---
    const protoDir = path.join(ROOT, 'prototype');
    // F6: bind to 127.0.0.1 only to avoid exposing on all interfaces
    spawnProcess(
      'npx',
      ['http-server', protoDir, '-p', String(protoPort), '--cors', '-c-1', '-a', '127.0.0.1'],
      { label: 'proto-server' },
      disposables,
    );

    // --- Spawn Vite dev server ---
    spawnProcess(
      'npm',
      ['run', '-w', 'frontend', 'dev'],
      {
        label: 'vite-dev',
        env: { ...process.env, VITE_AUTH_MODE: 'mock' },
      },
      disposables,
    );

    // --- Wait for both ports ---
    console.error('[harness] Waiting for servers...');
    await Promise.all([waitForPort(protoPort, 60_000), waitForPort(reactPort, 60_000)]);
    console.error(`[harness] Servers ready (proto=:${protoPort}, react=:${reactPort})`);

    // F5: chromium.launch is AFTER teardown registration — any failure triggers cleanup
    const browser: Browser = await chromium.launch({ headless: !opts.headed });
    disposables.push({
      kill: () => {
        browser.close().catch((e) => {
          // F9: log browser close errors
          process.stderr.write(`[visual-diff] Warning: browser.close() error: ${e}\n`);
        });
      },
    });

    const protoContext = await browser.newContext();
    const reactContext = await browser.newContext();
    const protoPage = await protoContext.newPage();
    const reactPage = await reactContext.newPage();

    // --- Load prototype ---
    await protoPage.goto(`http://127.0.0.1:${protoPort}/prototype.html`);

    // Ensure #page-voc is visible (prototype hides all pages initially)
    await protoPage.evaluate(() => {
      document.querySelectorAll<HTMLElement>('[id^="page-"]').forEach((el) => {
        el.style.display = 'none';
      });
      const voc = document.getElementById('page-voc');
      if (voc) voc.style.display = '';
    });

    // Wait for prototype JS data renderer to populate rows
    try {
      await protoPage.waitForFunction(() => document.querySelectorAll('#listArea > *').length > 0, {
        timeout: 10_000,
      });
    } catch {
      console.error('[harness] Warning: prototype #listArea rows did not appear within 10s');
    }

    // --- Mock auth API endpoints via Playwright route interception ---
    // AuthContext calls /api/auth/me on mount and /api/auth/mock-login on submit.
    // MSW doesn't cover these, and the backend isn't running. We stub them directly.
    const mockUser = {
      id: 'harness-user-1',
      email: 'harness@dev.local',
      name: 'Harness Admin',
      role: 'admin',
    };

    // F10: Narrow route pattern to auth endpoints only — avoids intercepting vite HMR / MSW
    await reactContext.route('**/api/auth/**', async (route) => {
      const u = new URL(route.request().url());
      if (u.pathname === '/api/auth/me') {
        // getMe() expects AuthUser directly (no wrapper)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUser),
        });
      } else if (u.pathname === '/api/auth/mock-login') {
        // mockLogin() expects { user: AuthUser }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: mockUser }),
        });
      } else {
        await route.continue();
      }
    });

    // --- Load React app via MockLoginPage ---
    await reactPage.goto(`http://127.0.0.1:${reactPort}/mock-login`);

    // Submit the mock login form (default role=admin)
    // After login, navigate('/') fires, which the router redirects to /voc.
    try {
      await reactPage.waitForSelector('form', { timeout: 10_000 });
      await reactPage.click('button[type="submit"]');
      // Wait for URL to contain /voc (handles trailing slash variants)
      await reactPage.waitForURL(`**\/voc**`, { timeout: 15_000 });
    } catch (e) {
      console.error(
        '[harness] Warning: mock login waitForURL timed out; trying direct navigation to /voc',
      );
      try {
        await reactPage.goto(`http://127.0.0.1:${reactPort}/voc`);
      } catch (navErr) {
        console.error('[harness] Warning: direct navigation to /voc failed:', navErr);
      }
    }

    // Wait for loading indicator to disappear
    try {
      await reactPage.waitForSelector('[data-testid="voc-loading"]', {
        state: 'detached',
        timeout: 10_000,
      });
    } catch {
      // Loading indicator may not appear if data loads fast
    }

    return { protoPage, reactPage, teardown };
  } catch (err) {
    // F5: any boot error — tear down whatever was started, then rethrow
    await teardown();
    throw err;
  }
}
