/**
 * @module shared/contracts/notification/io
 *
 * Notifications API contract.
 *
 * Wave 5 Phase A: BE implementation lands. Contract is additive vs Wave 1.5
 * PR-β stub — `voc_id` / `voc_issue_code` / `voc_title` / `isUrgent` added,
 * legacy `label` / `href` retained (BE composes them server-side so FE consumers
 * keep rendering until Phase B refactor).
 *
 * type enum: DB CHECK (`migrations/006_settings.sql`) restricts to
 * `comment` | `status_change` | `assigned`. `mention` is FE-internal (Wave 1.5
 * PR-β fixtures) and is preserved in the enum for backward compatibility but
 * BE will never emit it.
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
  // Wave 5 Phase A — VOC backref + Urgent flag (priority join, evaluated at read time).
  voc_id: Uuid.optional(),
  voc_issue_code: z.string().optional(),
  voc_title: z.string().optional(),
  isUrgent: z.boolean().optional(),
});
export type NotificationItem = z.infer<typeof NotificationItem>;

export const NotificationListResponse = z.object({
  items: z.array(NotificationItem),
  unreadCount: z.number().int().nonnegative(),
});
export type NotificationListResponse = z.infer<typeof NotificationListResponse>;

export const UnreadCountResponse = z.object({
  count: z.number().int().nonnegative(),
});
export type UnreadCountResponse = z.infer<typeof UnreadCountResponse>;

export const MarkAllReadResponse = z.object({
  unreadCount: z.literal(0),
});
export type MarkAllReadResponse = z.infer<typeof MarkAllReadResponse>;
