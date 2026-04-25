const BASE = '/api';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'comment' | 'status_change' | 'assigned';
  voc_id: string | null;
  message: string;
  is_read: boolean;
  voc_priority: string | null;
  created_at: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${BASE}/notifications`, { credentials: 'include' });
  if (!res.ok) throw new Error('fetch notifications failed');
  return res.json() as Promise<AppNotification[]>;
}

export async function getUnreadCount(
  etag?: string,
): Promise<{ count: number; etag: string } | null> {
  const headers: HeadersInit = {};
  if (etag) headers['If-None-Match'] = etag;
  const res = await fetch(`${BASE}/notifications/unread-count`, {
    credentials: 'include',
    headers,
  });
  if (res.status === 304) return null;
  if (!res.ok) throw new Error('fetch unread count failed');
  const data = (await res.json()) as { count: number };
  return { count: data.count, etag: res.headers.get('ETag') ?? '' };
}

export async function markRead(id: string): Promise<void> {
  await fetch(`${BASE}/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
}
