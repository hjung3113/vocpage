/**
 * Tag Master API hooks (W3-4)
 * Spec: requirements.md §15.3 + feature-voc.md §9.4.6
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
  type TagMasterListQuery,
} from '@contracts/admin/tag';

const QUERY_KEY = ['admin', 'tags'] as const;

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

export function useSuspendTagRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & z.infer<typeof TagRuleSuspendInput>) =>
      apiPatch(
        `/api/admin/tag-rules/${id}/suspend`,
        body,
        z.object({ id: z.string(), suspended_until: z.string().nullable() }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
