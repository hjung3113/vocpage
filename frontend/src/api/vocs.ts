export interface VocFilters {
  status?: string;
  priority?: string;
  system_id?: string;
  menu_id?: string;
  assignee_id?: string;
  keyword?: string;
  tag_id?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface VocSummary {
  id: string;
  issue_code: string | null;
  title: string;
  status: string;
  priority: string;
  author_id: string;
  assignee_id: string | null;
  system_id: string;
  menu_id: string;
  voc_type_id: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface VocDetail extends VocSummary {
  body: string;
  structured_payload: Record<string, unknown> | null;
  review_status: string | null;
  source: string;
}

export interface VocListResponse {
  data: VocSummary[];
  total: number;
  page: number;
  limit: number;
}

const BASE = '/api/vocs';

export async function listVocs(filters: VocFilters = {}): Promise<VocListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`listVocs: ${res.status}`);
  return res.json() as Promise<VocListResponse>;
}

export async function createVoc(data: {
  title: string;
  body: string;
  system_id: string;
  menu_id: string;
  voc_type_id: string;
}): Promise<VocDetail> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`createVoc: ${res.status}`);
  return res.json() as Promise<VocDetail>;
}

export async function getVoc(id: string): Promise<VocDetail> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(`getVoc: ${res.status}`);
  return res.json() as Promise<VocDetail>;
}

export interface UpdateVocPayload {
  title?: string;
  body?: string;
  assignee_id?: string;
  priority?: string;
  due_date?: string;
  voc_type_id?: string;
  menu_id?: string;
}

export async function updateVoc(id: string, data: UpdateVocPayload): Promise<VocDetail> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`updateVoc: ${res.status}`);
  return res.json() as Promise<VocDetail>;
}

export async function updateVocStatus(
  id: string,
  status: string,
  comment?: string,
): Promise<VocDetail> {
  const res = await fetch(`${BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment }),
  });
  if (!res.ok) throw new Error(`updateVocStatus: ${res.status}`);
  return res.json() as Promise<VocDetail>;
}

export async function deleteVoc(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteVoc: ${res.status}`);
}
