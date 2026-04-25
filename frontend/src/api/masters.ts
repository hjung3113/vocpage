const BASE = '/api';

export interface MasterStatus {
  mode: 'live' | 'snapshot' | 'cold_start';
  loaded_at?: string;
}

export interface MasterRefreshResult {
  swapped: boolean;
  loaded_at?: string;
  error?: string;
  kept_loaded_at?: string;
  sources?: { equipment: { loaded_at: string }; db: { loaded_at: string } };
}

export async function getMasterStatus(): Promise<MasterStatus> {
  const res = await fetch(`${BASE}/masters/status`, { credentials: 'include' });
  if (!res.ok) throw new Error('fetch master status failed');
  return res.json() as Promise<MasterStatus>;
}

export async function searchMaster(type: string, q: string): Promise<string[]> {
  const params = new URLSearchParams({ type, q });
  const res = await fetch(`${BASE}/masters/search?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('master search failed');
  const data = (await res.json()) as { items: string[]; mode: string };
  return data.items;
}

export async function triggerAdminRefresh(): Promise<MasterRefreshResult> {
  const res = await fetch(`${BASE}/admin/masters/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('admin master refresh failed');
  return res.json() as Promise<MasterRefreshResult>;
}

export async function triggerVocRefresh(vocId: string): Promise<MasterRefreshResult> {
  const res = await fetch(`${BASE}/vocs/${vocId}/masters/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('voc master refresh failed');
  return res.json() as Promise<MasterRefreshResult>;
}
