/**
 * useCreateTagRule — D-11 optimistic update contract (Phase 1 Plan 05 GREEN).
 *
 * Wave 0 (Plan 01) staged this file as 4 `test.todo`. Plan 05 flips them to
 * live `it(...)` against the implemented hook + MSW handlers.
 *
 * Contract: .planning/phases/01-tag-rules-consolidation/01-CONTEXT.md D-11
 *   - onMutate increments rule_ref_count for the targeted tag in the
 *     ['admin','tags'] cache by +1 (synchronously, before fetch resolves).
 *   - onError restores prev cache snapshot (rollback).
 *   - onSettled invalidates ['admin','tags'] AND ['admin','tags',tagId,'rules'].
 *   - Concurrent double-fire — both onMutate paths call cancelQueries first;
 *     onSettled invalidate is the ground truth (Pitfall 5 / T-01-13).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';

import {
  adminTagsHandlers,
  resetAdminTagStore,
  FIXTURE_TAG_IDS,
} from '../../../../../test/mocks/handlers/admin-tags';
import { useCreateTagRule } from '../tag-master.api';

const server = setupServer(...adminTagsHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...adminTagsHandlers);
  resetAdminTagStore();
});
afterAll(() => server.close());

const TAG_A = FIXTURE_TAG_IDS.general_bug;
const QUERY_KEY = ['admin', 'tags'] as const;
const RULES_KEY = (tagId: string) => ['admin', 'tags', tagId, 'rules'] as const;

interface CacheRow {
  id: string;
  name: string;
  rule_ref_count: number;
}
interface CacheShape {
  rows: CacheRow[];
  page: number;
  per_page: number;
  total: number;
}

function makeCache(refCountForA = 2): CacheShape {
  return {
    rows: [
      { id: TAG_A, name: 'A', rule_ref_count: refCountForA },
      { id: 'tag-b', name: 'B', rule_ref_count: 0 },
    ],
    page: 1,
    per_page: 20,
    total: 2,
  };
}

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

function makeQc() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe('useCreateTagRule — D-11 optimistic update', () => {
  it('onMutate increments rule_ref_count for the targeted tag in admin tags cache by +1', async () => {
    const qc = makeQc();
    qc.setQueryData(QUERY_KEY, makeCache(2));

    const { result } = renderHook(() => useCreateTagRule(TAG_A), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({ keywords: ['x'], match_mode: 'keyword' });

    // Optimistic patch is applied synchronously inside onMutate, BEFORE fetch resolves.
    await waitFor(() => {
      const cache = qc.getQueryData<CacheShape>(QUERY_KEY);
      expect(cache?.rows.find((r) => r.id === TAG_A)?.rule_ref_count).toBe(3);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('onError restores prev cache snapshot', async () => {
    const qc = makeQc();
    qc.setQueryData(QUERY_KEY, makeCache(2));

    // Override POST to fail with 500
    server.use(
      http.post('/api/admin/tags/:tagId/rules', () =>
        HttpResponse.json(
          { code: 'INTERNAL', message: 'simulated', details: null },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateTagRule(TAG_A), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({ keywords: ['x'], match_mode: 'keyword' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cache = qc.getQueryData<CacheShape>(QUERY_KEY);
    expect(cache?.rows.find((r) => r.id === TAG_A)?.rule_ref_count).toBe(2);
  });

  it("onSettled invalidates ['admin','tags'] and ['admin','tags',tagId,'rules']", async () => {
    const qc = makeQc();
    qc.setQueryData(QUERY_KEY, makeCache(2));

    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTagRule(TAG_A), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({ keywords: ['x'], match_mode: 'keyword' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calls = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    const hasAdminTags = calls.some(
      (k) => Array.isArray(k) && k[0] === 'admin' && k[1] === 'tags' && k.length === 2,
    );
    const hasRulesSubkey = calls.some(
      (k) =>
        Array.isArray(k) &&
        k[0] === 'admin' &&
        k[1] === 'tags' &&
        k[2] === TAG_A &&
        k[3] === 'rules',
    );
    expect(hasAdminTags).toBe(true);
    expect(hasRulesSubkey).toBe(true);

    // Sanity — the keys we expect are equivalent to the published constants.
    expect(QUERY_KEY).toEqual(['admin', 'tags']);
    expect(RULES_KEY(TAG_A)).toEqual(['admin', 'tags', TAG_A, 'rules']);
  });

  it('concurrent double-fire — both onMutate paths cancelQueries first; onSettled invalidate is ground truth', async () => {
    const qc = makeQc();
    qc.setQueryData(QUERY_KEY, makeCache(2));

    const cancelSpy = vi.spyOn(qc, 'cancelQueries');

    const { result } = renderHook(() => useCreateTagRule(TAG_A), {
      wrapper: makeWrapper(qc),
    });

    // Fire two mutations in the same tick.
    const p1 = result.current.mutateAsync({ keywords: ['x1'], match_mode: 'keyword' });
    const p2 = result.current.mutateAsync({ keywords: ['x2'], match_mode: 'keyword' });

    await Promise.all([p1, p2]);

    // Both onMutate paths must have called cancelQueries on QUERY_KEY.
    const cancelKeys = cancelSpy.mock.calls.map((c) => c[0]?.queryKey);
    const cancelCount = cancelKeys.filter(
      (k) => Array.isArray(k) && k[0] === 'admin' && k[1] === 'tags',
    ).length;
    expect(cancelCount).toBeGreaterThanOrEqual(2);

    // Optimistic patch was applied twice → +2 from baseline 2 = 4 (final cache).
    // No useAdminTags observer is mounted, so invalidate does not refetch — the
    // cache retains the +1 per successful create as ground-truth proxy.
    const finalCache = qc.getQueryData<CacheShape>(QUERY_KEY);
    expect(finalCache?.rows.find((r) => r.id === TAG_A)?.rule_ref_count).toBe(4);
  });
});
