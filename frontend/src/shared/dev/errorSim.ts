/**
 * Dev-only error simulation toggle for MSW handlers.
 * Read by handlers via `getErrorSimMode()`; set by `VocErrorSimSelector`.
 *
 * Multi-tab sync (FU L-1): mode persists in localStorage. Cross-tab updates
 * arrive via the native `storage` event; same-tab subscribers get a custom
 * `voc-error-sim-change` event because storage events do not fire in the
 * tab that wrote the value.
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

const MODES: ReadonlySet<ErrorSimMode> = new Set([
  'off',
  'network-fail',
  'http-500',
  'slow',
  'partial',
]);

const STORAGE_KEY = 'voc.errorSim.mode';
const SAME_TAB_EVENT = 'voc-error-sim-change';

declare global {
  interface Window {
    __vocErrorSimMode?: ErrorSimMode;
  }
}

function readStored(): ErrorSimMode | null {
  try {
    const v = window.localStorage?.getItem(STORAGE_KEY);
    return v && (MODES as Set<string>).has(v) ? (v as ErrorSimMode) : null;
  } catch {
    return null;
  }
}

export function getErrorSimMode(): ErrorSimMode {
  if (typeof window === 'undefined') return 'off';
  return readStored() ?? window.__vocErrorSimMode ?? 'off';
}

export function setErrorSimMode(mode: ErrorSimMode): void {
  if (typeof window === 'undefined') return;
  window.__vocErrorSimMode = mode;
  try {
    window.localStorage?.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore (private mode / quota)
  }
  window.dispatchEvent(new CustomEvent<ErrorSimMode>(SAME_TAB_EVENT, { detail: mode }));
}

/**
 * Subscribe to error-sim mode changes from any tab. Returns an unsubscribe.
 */
export function subscribeErrorSimMode(cb: (mode: ErrorSimMode) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onSameTab = (e: Event) => {
    const next = (e as CustomEvent<ErrorSimMode>).detail;
    if (next && (MODES as Set<string>).has(next)) cb(next);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    const next = e.newValue;
    if (next && (MODES as Set<string>).has(next)) cb(next as ErrorSimMode);
  };
  window.addEventListener(SAME_TAB_EVENT, onSameTab);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SAME_TAB_EVENT, onSameTab);
    window.removeEventListener('storage', onStorage);
  };
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
