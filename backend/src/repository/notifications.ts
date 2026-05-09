/**
 * Notifications repository — raw SQL against `notifications` (migrations/006)
 * + join with `vocs` (issue_code/title/priority) for read-side DTO.
 *
 * Wave 5 Phase A. See `feature-voc.md §8.6 / §8.14` and
 * `docs/specs/plans/wave-5-notifications.md §3` for behavioural decisions.
 */
import { pool } from '../db';

export type NotificationType = 'comment' | 'status_change' | 'assigned';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  voc_id: string;
  read_at: string | null;
  created_at: string;
  // Joined from vocs:
  voc_issue_code: string;
  voc_title: string;
  voc_priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UnreadSummary {
  count: number;
  latest_id: string | null;
  latest_created_at: string | null;
}

const DEBOUNCE_MINUTES = 5;
const TRIM_DAYS = 30;
const TRIM_CAP = 50;

/**
 * 5-minute debounce probe (W5-D3). Returns true when an identical
 * (user_id, type, voc_id) row exists within the window.
 */
export async function hasRecentNotification(
  user_id: string,
  type: NotificationType,
  voc_id: string,
): Promise<boolean> {
  const r = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM notifications
       WHERE user_id = $1 AND type = $2 AND voc_id = $3
         AND created_at > now() - ($4 || ' minutes')::interval
     ) AS exists`,
    [user_id, type, voc_id, DEBOUNCE_MINUTES],
  );
  return r.rows[0]?.exists ?? false;
}

export async function insertNotification(input: {
  user_id: string;
  type: NotificationType;
  voc_id: string;
}): Promise<{ id: string; created_at: string } | null> {
  const r = await pool.query<{ id: string; created_at: string }>(
    `INSERT INTO notifications (user_id, type, voc_id)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
    [input.user_id, input.type, input.voc_id],
  );
  return r.rows[0] ?? null;
}

/**
 * Lazy trim (W5-D4). Run on every list-call to enforce both retention bounds.
 *   1. Delete rows older than 30 days.
 *   2. For the calling user, delete rows beyond the 50-row cap (oldest first).
 */
export async function lazyTrim(user_id: string): Promise<void> {
  await pool.query(
    `DELETE FROM notifications
      WHERE created_at < now() - ($1 || ' days')::interval`,
    [TRIM_DAYS],
  );
  await pool.query(
    `DELETE FROM notifications
      WHERE id IN (
        SELECT id FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         OFFSET $2
      )`,
    [user_id, TRIM_CAP],
  );
}

export async function listForUser(user_id: string): Promise<NotificationRow[]> {
  const r = await pool.query<NotificationRow>(
    `SELECT n.id, n.user_id, n.type, n.voc_id, n.read_at, n.created_at,
            v.issue_code AS voc_issue_code, v.title AS voc_title,
            v.priority  AS voc_priority
       FROM notifications n
       JOIN vocs v ON v.id = n.voc_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2`,
    [user_id, TRIM_CAP],
  );
  return r.rows;
}

export async function unreadSummaryForUser(user_id: string): Promise<UnreadSummary> {
  const r = await pool.query<{ count: string; latest_id: string | null; latest_created_at: string | null }>(
    `SELECT count(*)::text AS count,
            (SELECT id         FROM notifications WHERE user_id = $1 AND read_at IS NULL ORDER BY created_at DESC LIMIT 1) AS latest_id,
            (SELECT created_at FROM notifications WHERE user_id = $1 AND read_at IS NULL ORDER BY created_at DESC LIMIT 1) AS latest_created_at
       FROM notifications
      WHERE user_id = $1 AND read_at IS NULL`,
    [user_id],
  );
  const row = r.rows[0];
  return {
    count: Number(row?.count ?? 0),
    latest_id: row?.latest_id ?? null,
    latest_created_at: row?.latest_created_at ?? null,
  };
}

export async function markAllRead(user_id: string): Promise<void> {
  await pool.query(
    `UPDATE notifications SET read_at = now()
      WHERE user_id = $1 AND read_at IS NULL`,
    [user_id],
  );
}

export async function markOneRead(id: string, user_id: string): Promise<boolean> {
  const r = await pool.query(
    `UPDATE notifications SET read_at = now()
      WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
    [id, user_id],
  );
  return (r.rowCount ?? 0) > 0;
}

export const __testing__ = { DEBOUNCE_MINUTES, TRIM_DAYS, TRIM_CAP };
