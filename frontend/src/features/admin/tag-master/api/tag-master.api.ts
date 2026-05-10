/**
 * Tag Master API hooks (W3-4)
 * Spec: requirements.md §15.3 + feature-voc.md §9.4.6
 *
 * Phase 01 Plan 05: nested tag-rule hooks (D-08) with D-11 optimistic patches on
 * count-changing mutations (create/delete). Suspend/Update do NOT change
 * rule_ref_count, so they only invalidate.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet, apiPost, apiPatch, apiDelete } from '@shared/api/client';
import {
  TagMasterListResponse,
  TagMasterCreate,
  TagMasterPatch,
  TagMasterMergeInput,
  TagExternalToggle,
  TagRuleSuspendInput,
  TagMasterItem,
  TagRule,
  TagRuleCreate,
  TagRulePatch,
  TagRuleListResponse,
  type TagMasterListQuery,
  type TagMasterListResponse as TagMasterListResponseT,
  type TagRuleListQueryT,
} from '@contracts/admin/tag';

const QUERY_KEY = ['admin', 'tags'] as const;
const RULES_KEY = (tagId: string) => ['admin', 'tags', tagId, 'rules'] as const;

// ── Queries ───────────────────────────────────────────────────────────────────

export function useAdminTags(query?: Partial<TagMasterListQuery>) {
  const params = new URLSearchParams();
  if (query?.kind) params.set('kind', query.kind);
  if (query?.q) params.set('q', query.q);
  if (query?.page) params.set('page', String(query.page));
  if (query?.per_page) params.set('per_page', String(query.per_page));
  const qs = params.toString();

  return useQuery({
    queryKey: [...QUERY_KEY, query],
    queryFn: ({ signal }) =>
      apiGet(`/api/admin/tags${qs ? `?${qs}` : ''}`, TagMasterListResponse, { signal }),
  });
}

export function useAdminTagRules(tagId: string, query?: Partial<TagRuleListQueryT>) {
  const params = new URLSearchParams();
  if (query?.q) params.set('q', query.q);
  if (query?.page) params.set('page', String(query.page));
  if (query?.per_page) params.set('per_page', String(query.per_page));
  const qs = params.toString();

  return useQuery({
    queryKey: [...RULES_KEY(tagId), query],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/admin/tags/${tagId}/rules${qs ? `?${qs}` : ''}`,
        TagRuleListResponse,
        { signal },
      ),
    enabled: Boolean(tagId),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof TagMasterCreate>) =>
      apiPost('/api/admin/tags', input, TagMasterItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRenameTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & z.infer<typeof TagMasterPatch>) =>
      apiPatch(`/api/admin/tags/${id}`, body, TagMasterItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useMergeTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & z.infer<typeof TagMasterMergeInput>) =>
      apiPost(`/api/admin/tags/${id}/merge`, body, z.object({ mergedCount: z.number() })),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleExternal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & z.infer<typeof TagExternalToggle>) =>
      apiPatch(`/api/admin/tags/${id}/external`, body, TagMasterItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// ── Tag Rules (Phase 01 — D-08 nested) ────────────────────────────────────────

/**
 * D-11 optimistic patch helpers for `['admin','tags']` cache.
 *
 * Pitfall 5 (T-01-13): cancelQueries first, snapshot prev, mutate cache,
 * onError rollback, onSettled invalidate is the ground truth.
 *
 * Cache shape: TagMasterListResponse — `{ rows: TagMasterItem[], page, per_page, total }`.
 * The `useAdminTags` hook scopes cache by `[...QUERY_KEY, query]`, so we patch ALL
 * matching entries via `setQueriesData` (broad query-key match).
 */
type AdminTagsCache = TagMasterListResponseT | undefined;

function patchRuleRefCount(
  cache: AdminTagsCache,
  tagId: string,
  delta: number,
): AdminTagsCache {
  if (!cache) return cache;
  return {
    ...cache,
    rows: cache.rows.map((row) =>
      row.id === tagId
        ? { ...row, rule_ref_count: Math.max(0, row.rule_ref_count + delta) }
        : row,
    ),
  };
}

export function useCreateTagRule(tagId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof TagRuleCreate>) =>
      apiPost(`/api/admin/tags/${tagId}/rules`, input, TagRule),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueriesData<TagMasterListResponseT>({ queryKey: QUERY_KEY });
      qc.setQueriesData<TagMasterListResponseT>({ queryKey: QUERY_KEY }, (old) =>
        patchRuleRefCount(old, tagId, +1),
      );
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: RULES_KEY(tagId) });
    },
  });
}

export function useUpdateTagRule(tagId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, ...input }: { ruleId: string } & z.infer<typeof TagRulePatch>) =>
      apiPatch(`/api/admin/tags/${tagId}/rules/${ruleId}`, input, TagRule),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: RULES_KEY(tagId) });
    },
  });
}

export function useDeleteTagRule(tagId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiDelete(`/api/admin/tags/${tagId}/rules/${ruleId}`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueriesData<TagMasterListResponseT>({ queryKey: QUERY_KEY });
      qc.setQueriesData<TagMasterListResponseT>({ queryKey: QUERY_KEY }, (old) =>
        patchRuleRefCount(old, tagId, -1),
      );
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: RULES_KEY(tagId) });
    },
  });
}

/**
 * Suspend / resume a tag rule (Admin only).
 *
 * Phase 01 Plan 05: signature changed from `({ id, suspended_until })` to
 * `({ tagId, ruleId, suspended_until })` — D-08 nested route.
 * No optimistic patch (rule_ref_count unchanged).
 */
export function useSuspendTagRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tagId,
      ruleId,
      ...body
    }: { tagId: string; ruleId: string } & z.infer<typeof TagRuleSuspendInput>) =>
      apiPatch(
        `/api/admin/tags/${tagId}/rules/${ruleId}/suspend`,
        body,
        TagRule,
      ),
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: RULES_KEY(vars.tagId) });
    },
  });
}
