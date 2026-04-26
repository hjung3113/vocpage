export interface Notice {
  id: string;
  title: string;
  body: string;
  level: 'normal' | 'important' | 'urgent';
  is_popup: boolean;
  is_visible: boolean;
  visible_from: string | null;
  visible_to: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export async function listNotices(): Promise<Notice[]> {
  const res = await fetch('/api/notices');
  if (!res.ok) throw new Error(`listNotices: ${res.status}`);
  const json = (await res.json()) as { data: Notice[] };
  return json.data;
}

export async function listPopupNotices(): Promise<{ notices: Notice[] }> {
  const res = await fetch('/api/notices/popup');
  if (!res.ok) throw new Error(`listPopupNotices: ${res.status}`);
  return res.json();
}

export async function getNotice(id: string): Promise<Notice> {
  const res = await fetch(`/api/notices/${id}`);
  if (!res.ok) throw new Error(`getNotice: ${res.status}`);
  return res.json();
}

export async function createNotice(payload: Partial<Notice>): Promise<Notice> {
  const res = await fetch('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createNotice: ${res.status}`);
  return res.json();
}

export async function updateNotice(id: string, payload: Partial<Notice>): Promise<Notice> {
  const res = await fetch(`/api/notices/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateNotice: ${res.status}`);
  return res.json();
}

export async function deleteNotice(id: string): Promise<void> {
  const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteNotice: ${res.status}`);
}

export async function restoreNotice(id: string): Promise<Notice> {
  const res = await fetch(`/api/notices/${id}/restore`, { method: 'POST' });
  if (!res.ok) throw new Error(`restoreNotice: ${res.status}`);
  return res.json();
}

export async function toggleNoticeVisibility(id: string, is_visible: boolean): Promise<Notice> {
  const res = await fetch(`/api/notices/${id}/visibility`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_visible }),
  });
  if (!res.ok) throw new Error(`toggleNoticeVisibility: ${res.status}`);
  return res.json();
}
