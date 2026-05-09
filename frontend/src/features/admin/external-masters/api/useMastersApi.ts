/**
 * External Masters admin API hooks — Wave 3 Phase D (W3-6).
 * Spec: requirements.md §16.3, external-masters.md §0/§6
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Types (mirrors shared/contracts/admin/master.ts) ────────────────────────

export type MasterMode = 'live' | 'snapshot' | 'cold';

export interface SourceEntry {
  loaded_at: string;
  kept_loaded_at?: string;
}

export interface MasterStatusResponse {
  loaded_at: string | null;
  cooldown_until: string | null;
  mode: MasterMode;
  sources: {
    equipment: SourceEntry | null;
    db: SourceEntry | null;
    program: SourceEntry | null;
  };
}

export interface MasterRefreshResponse {
  swapped: boolean;
  loaded_at: string;
  sources: {
    equipment: { loaded_at: string };
    db: { loaded_at: string };
  };
}

export interface RefreshError {
  status: number;
  code: string;
  message: string;
  details?: {
    cooldown_until?: string | null;
    kept_loaded_at?: string | null;
  };
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchMasterStatus(): Promise<MasterStatusResponse> {
  const res = await fetch('/api/admin/masters/status');
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  return res.json() as Promise<MasterStatusResponse>;
}

async function postRefresh(): Promise<MasterRefreshResponse> {
  const res = await fetch('/api/admin/masters/refresh', { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw Object.assign(
      new Error((body.message as string) ?? 'Refresh failed'),
      { status: res.status, code: body.code, details: body.details },
    );
  }
  return res.json() as Promise<MasterRefreshResponse>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const MASTERS_STATUS_KEY = ['admin', 'masters', 'status'] as const;

export function useMasterStatus() {
  return useQuery({
    queryKey: MASTERS_STATUS_KEY,
    queryFn: fetchMasterStatus,
    staleTime: 30_000, // 30 s — UI still reflects real mode quickly
  });
}

export function useRefreshMasters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postRefresh,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MASTERS_STATUS_KEY });
    },
  });
}
