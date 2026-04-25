import express from 'express';
import session from 'express-session';
import { authRouter } from '../../routes/auth';
import { vocRouter } from '../../routes/vocs';
import { commentRouter } from '../../routes/comments';
import { noteRouter } from '../../routes/notes';
import { attachmentRouter } from '../../routes/attachments';
import { setPool } from '../../db';
import { createAuthMiddleware } from '../../auth';
import type { Pool } from 'pg';

export function createTestApp(pool?: Pool, authMode = 'mock') {
  process.env.AUTH_MODE = authMode;

  if (pool) {
    setPool(pool as Pool);
  }

  const app = express();

  app.use(express.json());
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
      },
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);

  const authMiddleware = createAuthMiddleware();
  app.use('/api/vocs', authMiddleware, vocRouter);
  app.use('/api/vocs/:vocId/comments', authMiddleware, commentRouter);
  app.use('/api/vocs/:vocId/notes', authMiddleware, noteRouter);
  app.use('/api/vocs/:vocId/attachments', authMiddleware, attachmentRouter);

  return app;
}
