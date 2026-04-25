const BASE = '/api';

export interface StructuredPayload {
  equipment?: string;
  maker?: string;
  model?: string;
  process?: string;
  symptom: string;
  root_cause: string;
  resolution: string;
  unverified_fields?: string[];
}

export interface VocPayloadHistoryItem {
  id: string;
  voc_id: string;
  payload: Record<string, unknown>;
  submitted_by: string;
  submitted_at: string;
  final_state: string | null;
  is_current: boolean;
}

export async function submitPayload(
  vocId: string,
  payload: StructuredPayload,
): Promise<VocPayloadHistoryItem> {
  const res = await fetch(`${BASE}/vocs/${vocId}/payload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`submitPayload: ${res.status}`);
  return res.json() as Promise<VocPayloadHistoryItem>;
}

export async function savePayloadDraft(
  vocId: string,
  draft: Partial<StructuredPayload>,
): Promise<void> {
  const res = await fetch(`${BASE}/vocs/${vocId}/payload-draft`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ draft }),
  });
  if (!res.ok) throw new Error(`savePayloadDraft: ${res.status}`);
}

export async function getPayloadHistory(vocId: string): Promise<VocPayloadHistoryItem[]> {
  const res = await fetch(`${BASE}/vocs/${vocId}/payload-history`, { credentials: 'include' });
  if (!res.ok) throw new Error(`getPayloadHistory: ${res.status}`);
  return res.json() as Promise<VocPayloadHistoryItem[]>;
}

export async function reviewPayload(
  vocId: string,
  decision: 'approved' | 'rejected',
  comment?: string,
): Promise<void> {
  const res = await fetch(`${BASE}/vocs/${vocId}/payload-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ decision, comment }),
  });
  if (!res.ok) throw new Error(`reviewPayload: ${res.status}`);
}

export async function requestPayloadDeletion(vocId: string): Promise<void> {
  const res = await fetch(`${BASE}/vocs/${vocId}/payload-delete-request`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`requestPayloadDeletion: ${res.status}`);
}
