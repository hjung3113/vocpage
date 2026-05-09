/**
 * Admin Users API hooks (W3-7 Phase E).
 * Spec: shared/contracts/admin/user.ts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AdminUserListResponse,
  AdminUserListQuery,
  AdminUserPatch,
  AdminUserItem,
} from '../../../../../../shared/contracts/admin/user';

async function fetchUserList(
  params: Partial<AdminUserListQuery>,
): Promise<AdminUserListResponse> {
  const qs = new URLSearchParams();
  if (params.role) qs.set('role', params.role);
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active));
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await fetch(`/api/admin/users?${qs}`);
  if (!res.ok) throw new Error(`Users list fetch failed: ${res.status}`);
  return res.json() as Promise<AdminUserListResponse>;
}

async function patchUser(id: string, patch: AdminUserPatch): Promise<AdminUserItem> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw Object.assign(
      new Error((body.message as string) ?? 'Patch failed'),
      { status: res.status, code: body.code },
    );
  }
  return res.json() as Promise<AdminUserItem>;
}

export function useUserList(params: Partial<AdminUserListQuery> = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => fetchUserList(params),
  });
}

export function usePatchUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AdminUserPatch }) => patchUser(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
