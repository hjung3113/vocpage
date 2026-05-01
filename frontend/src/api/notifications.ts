/**
 * Notifications API client — FE-only consumer in Wave 1.5 PR-β. BE는
 * 후속 PR. MSW가 `/api/notifications` 와 mark-all-read 핸들러 제공.
 */
import { apiGet, apiPost } from './client';
import {
  NotificationListResponse,
  MarkAllReadResponse,
} from '../../../shared/contracts/notification';

export const notificationsApi = {
  list(): Promise<NotificationListResponse> {
    return apiGet('/api/notifications', NotificationListResponse);
  },
  markAllRead(): Promise<MarkAllReadResponse> {
    return apiPost('/api/notifications/mark-all-read', {}, MarkAllReadResponse);
  },
};
