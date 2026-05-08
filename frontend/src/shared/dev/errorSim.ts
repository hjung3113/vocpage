/**
 * Dev-only error simulation toggle for MSW handlers.
 * Read by handlers via `getErrorSimMode()`; set by `VocErrorSimSelector`.
 *
 * Modes:
 *   - 'off'         → normal behavior
 *   - 'network-fail'→ HttpResponse.error() (network-level failure)
 *   - 'http-500'    → 500 envelope
 *   - 'slow'        → 3s artificial latency, then normal response
 *   - 'partial'     → 200 with truncated `rows` (only first item)
 */
import { HttpResponse } from 'msw';

export type ErrorSimMode = 'off' | 'network-fail' | 'http-500' | 'slow' | 'partial';

declare global {
  interface Window {
    __vocErrorSimMode?: ErrorSimMode;
  }
}

export function getErrorSimMode(): ErrorSimMode {
  if (typeof window === 'undefined') return 'off';
  return window.__vocErrorSimMode ?? 'off';
}

export function setErrorSimMode(mode: ErrorSimMode): void {
  if (typeof window === 'undefined') return;
  window.__vocErrorSimMode = mode;
}

export async function applyErrorSim<T>(
  mode: ErrorSimMode,
  proceed: () => Promise<T> | T,
): Promise<T | Response> {
  if (mode === 'off') return proceed();
  if (mode === 'network-fail') return HttpResponse.error();
  if (mode === 'http-500') {
    return HttpResponse.json(
      { error: { code: 'INTERNAL', message: '시뮬레이션된 서버 오류' } },
      { status: 500 },
    );
  }
  if (mode === 'slow') {
    await new Promise((r) => setTimeout(r, 3000));
    return proceed();
  }
  // partial — proceed and let caller truncate; default fall-through
  return proceed();
}
