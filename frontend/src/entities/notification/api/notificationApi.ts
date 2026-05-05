import { apiGet, apiPost } from '@shared/api/client';
import { NotificationListResponse, MarkAllReadResponse } from '@contracts/notification';

export const notificationsApi = {
  list(): Promise<NotificationListResponse> {
    return apiGet('/api/notifications', NotificationListResponse);
  },
  markAllRead(): Promise<MarkAllReadResponse> {
    return apiPost('/api/notifications/mark-all-read', {}, MarkAllReadResponse);
  },
};
