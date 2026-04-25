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

export interface UnreadCountResult {
  count: number;
  etag: string;
  hasUrgent: boolean;
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${BASE}/notifications`, { credentials: 'include' });
  if (res.status === 401) throw new HttpError(401, '401');
  if (!res.ok) throw new Error('fetch notifications failed');
  return res.json() as Promise<AppNotification[]>;
}

export async function getUnreadCount(etag?: string): Promise<UnreadCountResult | null> {
  const headers: HeadersInit = {};
  if (etag) headers['If-None-Match'] = etag;
  const res = await fetch(`${BASE}/notifications/unread-count`, {
    credentials: 'include',
    headers,
  });
  if (res.status === 304) return null;
  if (res.status === 401) throw new HttpError(401, '401');
  if (!res.ok) throw new Error('fetch unread count failed');
  const data = (await res.json()) as { count: number; has_urgent?: boolean };
  return {
    count: data.count,
    etag: res.headers.get('ETag') ?? '',
    hasUrgent: data.has_urgent ?? false,
  };
}

export async function markRead(id: string): Promise<void> {
  const res = await fetch(`${BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
  });
  // 404 is acceptable (already-deleted notification); other failures bubble up.
  if (!res.ok && res.status !== 404) throw new Error('markRead failed');
}

// R7-7: explicit bulk mark-as-read — call when opening the notification panel
export async function markAllRead(): Promise<void> {
  const res = await fetch(`${BASE}/notifications/read-all`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('markAllRead failed');
}
