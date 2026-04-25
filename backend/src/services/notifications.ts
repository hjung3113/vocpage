import type { Pool } from 'pg';
import logger from '../logger';

type NotificationType = 'comment' | 'status_change' | 'assigned';

// Constants (M2 minor): tunable retention/cap policy.
export const MAX_NOTIFICATIONS = 50;
export const DEBOUNCE_WINDOW = '5 minutes';
export const RETENTION_DAYS = 30;

interface EmitOptions {
  pool: Pool;
  userId: string;
  type: NotificationType;
  vocId: string;
}

export async function emitNotification(opts: EmitOptions): Promise<void> {
  try {
    // 1. 5-minute debounce — only consider unread notifications (read ones are out of scope)
    const { rows: existing } = await opts.pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND type = $2 AND voc_id = $3
         AND created_at > now() - interval '${DEBOUNCE_WINDOW}'
         AND read_at IS NULL
       LIMIT 1`,
      [opts.userId, opts.type, opts.vocId],
    );
    if (existing.length > 0) return;

    // 2. INSERT
    await opts.pool.query(`INSERT INTO notifications (user_id, type, voc_id) VALUES ($1, $2, $3)`, [
      opts.userId,
      opts.type,
      opts.vocId,
    ]);

    // 3. Cap at MAX_NOTIFICATIONS — safer pattern via threshold subquery (avoids
    //    NOT IN race conditions). When fewer than MAX rows exist the OFFSET subquery
    //    returns no row, the comparison is FALSE, and nothing is deleted.
    await opts.pool.query(
      `DELETE FROM notifications
       WHERE user_id = $1
         AND created_at < COALESCE(
           (SELECT created_at FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            OFFSET ${MAX_NOTIFICATIONS - 1} LIMIT 1),
           '1970-01-01'::timestamptz
         )`,
      [opts.userId],
    );

    // 4. 30-day retention — drop already-read notifications older than the window.
    await opts.pool.query(
      `DELETE FROM notifications
       WHERE user_id = $1
         AND read_at IS NOT NULL
         AND read_at < now() - interval '${RETENTION_DAYS} days'`,
      [opts.userId],
    );
  } catch (err) {
    logger.error({ err }, 'emitNotification failed');
  }
}
