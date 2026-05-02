/**
 * tcp-probe.ts — hand-rolled TCP port readiness check.
 * Polls a TCP connection until the port accepts connections or timeout expires.
 * ~30 lines, no external dependencies beyond Node built-ins.
 */

import * as net from 'net';

/**
 * waitForPort — resolves when the given port on localhost accepts a TCP connection,
 * or rejects after `timeoutMs` milliseconds.
 */
export async function waitForPort(port: number, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  const POLL_INTERVAL = 250;

  while (true) {
    const elapsed = Date.now() - start;
    if (elapsed >= timeoutMs) {
      throw new Error(`Timed out waiting for port ${port} after ${timeoutMs}ms`);
    }

    const ready = await probeTcp('127.0.0.1', port);
    if (ready) return;

    await sleep(POLL_INTERVAL);
  }
}

/** Single non-blocking TCP probe. Returns true if connection succeeds. */
function probeTcp(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(500);
    sock.once('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.once('error', () => {
      sock.destroy();
      resolve(false);
    });
    sock.once('timeout', () => {
      sock.destroy();
      resolve(false);
    });
    sock.connect(port, host);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
