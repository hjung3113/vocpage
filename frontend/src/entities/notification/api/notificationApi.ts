import { apiGet, apiPatch, apiPost } from '@shared/api/client';
import { apiGetWithETag } from '@shared/api/etagFetch';
import {
  NotificationListResponse,
  MarkAllReadResponse,
  UnreadCountResponse,
} from '@contracts/notification';
import { z } from 'zod';

const ReadOk = z.object({ ok: z.literal(true) });

export const notificationsApi = {
  list(): Promise<NotificationListResponse> {
    return apiGet('/api/notifications', NotificationListResponse);
  },
  unreadCount(): Promise<UnreadCountResponse> {
    return apiGetWithETag('/api/notifications/unread-count', UnreadCountResponse);
  },
  markAllRead(): Promise<MarkAllReadResponse> {
    return apiPost('/api/notifications/mark-all-read', {}, MarkAllReadResponse);
  },
  markOneRead(id: string): Promise<{ ok: true }> {
    return apiPatch(`/api/notifications/${id}/read`, {}, ReadOk);
  },
};
