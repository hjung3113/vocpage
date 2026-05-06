import { useCallback, useEffect, useState } from 'react';

/**
 * Persistent useState backed by localStorage.
 *
 * - SSR/test-safe: falls back to `defaultValue` if `localStorage` is
 *   unavailable or the stored value cannot be parsed.
 * - Writes are best-effort; quota / privacy errors are silently swallowed
 *   so that UI state still updates.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const read = useCallback((): T => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const [state, setState] = useState<T>(read);

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota / privacy mode errors
    }
  }, [key, state]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState(next);
  }, []);

  return [state, set];
}
