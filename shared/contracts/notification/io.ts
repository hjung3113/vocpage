/**
 * @module shared/contracts/notification/io
 *
 * Notifications API contract — FE-only consumer in Wave 1.5 PR-β. BE는
 * 후속 PR에서 구현 예정 (현재는 MSW 미러 한정).
 *
 * Shape mirrors prototype topbar bell dropdown 구조: list + unreadCount,
 * markAllRead mutation. type 은 mention/assigned/status_change/comment 4종.
 */
import { z } from 'zod';
import { Uuid } from '../common';

export const NotificationType = z.enum(['mention', 'assigned', 'status_change', 'comment']);
export type NotificationType = z.infer<typeof NotificationType>;

export const NotificationItem = z.object({
  id: Uuid,
  type: NotificationType,
  label: z.string(),
  href: z.string().optional(),
  createdAt: z.string(),
  read: z.boolean(),
});
export type NotificationItem = z.infer<typeof NotificationItem>;

export const NotificationListResponse = z.object({
  items: z.array(NotificationItem),
  unreadCount: z.number().int().nonnegative(),
});
export type NotificationListResponse = z.infer<typeof NotificationListResponse>;

export const MarkAllReadResponse = z.object({
  unreadCount: z.literal(0),
});
export type MarkAllReadResponse = z.infer<typeof MarkAllReadResponse>;
