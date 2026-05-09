/**
 * Trash admin API hooks — Wave 3 Phase C (W3-5).
 * Spec: shared/contracts/admin/trash.ts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TrashListResponse,
  VocRestoreLogEntry,
  VocRestoreResponse,
  TrashListQuery,
} from '../../../../../../shared/contracts/admin/trash';

async function fetchTrashList(
  params: Partial<TrashListQuery>,
): Promise<TrashListResponse> {
  const qs = new URLSearchParams();
  if (params.system_id) qs.set('system_id', params.system_id);
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await fetch(`/api/admin/vocs/trash?${qs}`);
  if (!res.ok) throw new Error(`Trash list fetch failed: ${res.status}`);
  return res.json() as Promise<TrashListResponse>;
}

async function restoreVoc(id: string): Promise<VocRestoreResponse> {
  const res = await fetch(`/api/vocs/${id}/restore`, { method: 'PATCH' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw Object.assign(
      new Error((body.message as string) ?? 'Restore failed'),
      { status: res.status, code: body.code },
    );
  }
  return res.json() as Promise<VocRestoreResponse>;
}

async function fetchRestoreLog(vocId: string): Promise<VocRestoreLogEntry[]> {
  const res = await fetch(`/api/admin/vocs/${vocId}/restore-log`);
  if (!res.ok) throw new Error(`Restore log fetch failed: ${res.status}`);
  return res.json() as Promise<VocRestoreLogEntry[]>;
}

export function useTrashList(params: Partial<TrashListQuery> = {}) {
  return useQuery({
    queryKey: ['admin', 'trash', params],
    queryFn: () => fetchTrashList(params),
  });
}

export function useRestoreVoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreVoc(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'trash'] });
      void qc.invalidateQueries({ queryKey: ['vocs'] });
    },
  });
}

export function useRestoreLog(vocId: string | null) {
  return useQuery({
    queryKey: ['admin', 'restore-log', vocId],
    queryFn: () => fetchRestoreLog(vocId!),
    enabled: !!vocId,
  });
}
