import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorageState } from '../useLocalStorageState';

const KEY = 'voc-test-localstorage-key';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns the default value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, { open: true }));
    expect(result.current[0]).toEqual({ open: true });
  });

  it('hydrates from existing localStorage value', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ open: false }));
    const { result } = renderHook(() => useLocalStorageState(KEY, { open: true }));
    expect(result.current[0]).toEqual({ open: false });
  });

  it('persists set() updates back to localStorage', () => {
    const { result } = renderHook(() => useLocalStorageState<number>(KEY, 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(window.localStorage.getItem(KEY)).toBe('42');
  });

  it('supports updater function', () => {
    const { result } = renderHook(() => useLocalStorageState<number>(KEY, 1));
    act(() => result.current[1]((n) => n + 9));
    expect(result.current[0]).toBe(10);
  });

  it('falls back to default when stored JSON is malformed', () => {
    window.localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useLocalStorageState(KEY, 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
