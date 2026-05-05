/**
 * MSW handlers for notifications — FE-only contract (BE는 후속 PR).
 *
 * Endpoints:
 *  - GET  /api/notifications          → { items, unreadCount }
 *  - POST /api/notifications/mark-all-read → { unreadCount: 0 }
 *
 * In-memory store mirrors `voc.ts` pattern so __resetNotificationMocks()
 * restores fixture state between tests.
 */
import { http, HttpResponse } from 'msw';
import {
  NotificationListResponse,
  MarkAllReadResponse,
} from '../../../../shared/contracts/notification';
import { NOTIFICATION_FIXTURES } from '../../../../shared/fixtures/notification.fixtures';

type NotificationItem = (typeof NOTIFICATION_FIXTURES)[number];

let store: NotificationItem[] = NOTIFICATION_FIXTURES.map((n) => ({ ...n }));

export const notificationsHandlers = [
  http.get('/api/notifications', () => {
    const items = [...store].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const unreadCount = items.filter((n) => !n.read).length;
    const body = NotificationListResponse.parse({ items, unreadCount });
    return HttpResponse.json(body);
  }),
  http.post('/api/notifications/mark-all-read', () => {
    store = store.map((n) => ({ ...n, read: true }));
    const body = MarkAllReadResponse.parse({ unreadCount: 0 });
    return HttpResponse.json(body);
  }),
];

export function __resetNotificationMocks() {
  store = NOTIFICATION_FIXTURES.map((n) => ({ ...n }));
}
