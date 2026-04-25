import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';

export const attachmentRouter = Router({ mergeParams: true });

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_COUNT = 5;

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = process.env.UPLOADS_DIR ?? 'uploads';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uuid = randomUUID();
    const original = path.basename(file.originalname);
    cb(null, `${uuid}-${original}`);
  },
});

const storage = process.env.NODE_ENV === 'test' ? multer.memoryStorage() : diskStorage;

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('UNSUPPORTED_MEDIA_TYPE'));
    }
  },
});

// ── Multer error handler ──────────────────────────────────────────────────────

export function multerErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err.message === 'UNSUPPORTED_MEDIA_TYPE') {
    res.status(415).json({ error: 'UNSUPPORTED_MEDIA_TYPE' });
    return;
  }
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'FILE_TOO_LARGE' });
    return;
  }
  next(err);
}

// ── GET /:vocId/attachments ───────────────────────────────────────────────────

attachmentRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId } = req.params;

  try {
    const vocResult = await pool.query(`SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      vocId,
    ]);

    if (vocResult.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const voc = vocResult.rows[0] as { author_id: string; assignee_id: string | null };

    if (user.role === 'user' && voc.author_id !== user.id && voc.assignee_id !== user.id) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM attachments WHERE voc_id = $1 ORDER BY created_at ASC`,
      [vocId],
    );

    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/vocs/:vocId/attachments failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /:vocId/attachments ──────────────────────────────────────────────────

attachmentRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        multerErrorHandler(err as Error, req, res, next);
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { vocId } = req.params;

    if (!req.file) {
      res.status(400).json({ error: 'MISSING_FILE' });
      return;
    }

    try {
      const vocResult = await pool.query(
        `SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`,
        [vocId],
      );

      if (vocResult.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const voc = vocResult.rows[0] as { author_id: string; assignee_id: string | null };

      if (user.role === 'user' && voc.author_id !== user.id && voc.assignee_id !== user.id) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const countResult = await pool.query(`SELECT COUNT(*) FROM attachments WHERE voc_id = $1`, [
        vocId,
      ]);
      const currentCount = parseInt(countResult.rows[0].count, 10);

      if (currentCount >= MAX_COUNT) {
        res.status(400).json({ error: 'ATTACHMENT_LIMIT_EXCEEDED' });
        return;
      }

      const uuid = randomUUID();
      const originalName = path.basename(req.file.originalname);
      const storagePath = `${vocId}/${uuid}-${originalName}`;

      const result = await pool.query(
        `INSERT INTO attachments (voc_id, uploader_id, filename, mime_type, size_bytes, storage_path)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [vocId, user.id, req.file.originalname, req.file.mimetype, req.file.size, storagePath],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/vocs/:vocId/attachments failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── DELETE /:vocId/attachments/:attachmentId ──────────────────────────────────

attachmentRouter.delete('/:attachmentId', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId, attachmentId } = req.params;

  try {
    const existing = await pool.query(`SELECT * FROM attachments WHERE id = $1 AND voc_id = $2`, [
      attachmentId,
      vocId,
    ]);

    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const attachment = existing.rows[0] as { uploader_id: string; storage_path: string };

    if (attachment.uploader_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    await pool.query(`DELETE FROM attachments WHERE id = $1`, [attachmentId]);

    // Delete the actual file if it exists on disk
    if (process.env.NODE_ENV !== 'test') {
      const uploadsDir = process.env.UPLOADS_DIR ?? 'uploads';
      const filename = path.basename(attachment.storage_path);
      const filePath = path.join(uploadsDir, filename);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== 'ENOENT') {
          logger.warn({ err: unlinkErr }, 'Failed to delete attachment file');
        }
      });
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'DELETE /api/vocs/:vocId/attachments/:attachmentId failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
