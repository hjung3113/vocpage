/**
 * Wave 5 W5-D7 — two query keys, separated by intent:
 *  - `unreadCount` polled every 30s with ETag/304 (Sidebar count + 🔴!)
 *  - `list`        fetched only when the panel/page is open
 */
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
  list: () => ['notifications', 'list'] as const,
} as const;
