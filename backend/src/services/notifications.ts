import type { Pool } from 'pg';
import logger from '../logger';

type NotificationType = 'comment' | 'status_change' | 'assigned';

interface EmitOptions {
  pool: Pool;
  userId: string;
  type: NotificationType;
  vocId: string;
}

export async function emitNotification(opts: EmitOptions): Promise<void> {
  try {
    // 1. 5분 debounce 체크
    const { rows: existing } = await opts.pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND type = $2 AND voc_id = $3
         AND created_at > now() - interval '5 minutes'
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

    // 3. 50건 초과 정리
    await opts.pool.query(
      `DELETE FROM notifications
       WHERE user_id = $1
         AND id NOT IN (
           SELECT id FROM notifications WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 50
         )`,
      [opts.userId],
    );
  } catch (err) {
    logger.error({ err }, 'emitNotification failed');
  }
}
