import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { requireAuth } from '../middleware/auth';
import { RETENTION_DAYS } from '../services/notifications';

export const notificationRouter = Router();

function buildMessage(type: string, vocTitle: string, newStatus?: string): string {
  if (type === 'comment') return `"${vocTitle}" VOC에 새 댓글이 달렸습니다.`;
  if (type === 'status_change')
    return `"${vocTitle}" VOC 상태가 ${newStatus ?? ''}(으)로 변경되었습니다.`;
  if (type === 'assigned') return `"${vocTitle}" VOC의 담당자로 배정되었습니다.`;
  return '';
}

// GET /api/notifications — returns recent notifications (read-only, spec §8.14 bulk-read is explicit via PATCH /read-all)
notificationRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;

  try {
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

// PATCH /api/notifications/read-all — idempotent bulk mark-as-read (R7-7: split from GET)
notificationRouter.patch(
  '/read-all',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    try {
      await pool.query(
        `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
        [user.id],
      );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'PATCH /api/notifications/read-all failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

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

// PATCH /api/notifications/:id/read — idempotent single-notification mark-as-read
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
