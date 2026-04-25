import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { RETENTION_DAYS } from '../services/notifications';

export const notificationRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  next();
}

function buildMessage(type: string, vocTitle: string, newStatus?: string): string {
  if (type === 'comment') return `"${vocTitle}" VOC에 새 댓글이 달렸습니다.`;
  if (type === 'status_change')
    return `"${vocTitle}" VOC 상태가 ${newStatus ?? ''}(으)로 변경되었습니다.`;
  if (type === 'assigned') return `"${vocTitle}" VOC의 담당자로 배정되었습니다.`;
  return '';
}

// GET /api/notifications — opening the panel marks all as read in bulk (spec §8.14).
notificationRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;

  try {
    // 1. Bulk-mark all unread as read for this user.
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [user.id],
    );

    // 2. Select recent notifications, excluding soft-deleted VOCs and notifications
    //    that have been read for more than RETENTION_DAYS days.
    //    NOTE: status_change messages currently use the VOC's *current* status from the
    //    join — point-in-time accuracy is a known limitation (no metadata column yet).
    const result = await pool.query(
      `SELECT n.id, n.user_id, n.type, n.voc_id,
              n.read_at IS NOT NULL AS is_read,
              n.created_at,
              v.title AS voc_title,
              v.priority AS voc_priority,
              v.status AS voc_status
       FROM notifications n
       INNER JOIN vocs v ON v.id = n.voc_id AND v.deleted_at IS NULL
       WHERE n.user_id = $1
         AND NOT (n.read_at IS NOT NULL AND n.read_at < now() - interval '${RETENTION_DAYS} days')
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [user.id],
    );

    const notifications = result.rows.map(
      (row: {
        id: string;
        user_id: string;
        type: string;
        voc_id: string | null;
        is_read: boolean;
        created_at: string;
        voc_title: string | null;
        voc_priority: string | null;
        voc_status: string | null;
      }) => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        voc_id: row.voc_id,
        message: buildMessage(row.type, row.voc_title ?? '', row.voc_status ?? undefined),
        is_read: row.is_read,
        voc_priority: row.voc_priority,
        created_at: row.created_at,
      }),
    );

    res.json(notifications);
  } catch (err) {
    logger.error({ err }, 'GET /api/notifications failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// GET /api/notifications/unread-count
notificationRouter.get(
  '/unread-count',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;

    try {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS count,
                EXTRACT(EPOCH FROM MAX(n.created_at)) AS max_ts,
                COALESCE(BOOL_OR(v.priority = 'urgent'), false) AS has_urgent
         FROM notifications n
         LEFT JOIN vocs v ON v.id = n.voc_id AND v.deleted_at IS NULL
         WHERE n.user_id = $1 AND n.read_at IS NULL`,
        [user.id],
      );

      const row = result.rows[0] as {
        count: number | string;
        max_ts: number | string | null;
        has_urgent: boolean | null;
      };
      const count = typeof row.count === 'string' ? parseInt(row.count, 10) : (row.count ?? 0);
      const maxTs = row.max_ts == null ? '0' : String(row.max_ts);
      const hasUrgent = row.has_urgent ?? false;
      // ETag includes max_ts so a new alert with the same count still busts caches.
      const etag = `W/"${count}-${maxTs}"`;

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        res.status(304).end();
        return;
      }

      res.setHeader('ETag', etag);
      res.json({ count, has_urgent: hasUrgent });
    } catch (err) {
      logger.error({ err }, 'GET /api/notifications/unread-count failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// PATCH /api/notifications/:id/read — idempotent, only flips when still unread.
notificationRouter.patch(
  '/:id/read',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { id } = req.params;

    try {
      const existing = await pool.query(`SELECT id, user_id FROM notifications WHERE id = $1`, [
        id,
      ]);

      if (existing.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const notif = existing.rows[0] as { user_id: string };
      if (notif.user_id !== user.id) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      // Idempotent: only update unread rows; already-read rows preserve their original read_at.
      await pool.query(
        `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
        [id, user.id],
      );

      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'PATCH /api/notifications/:id/read failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
