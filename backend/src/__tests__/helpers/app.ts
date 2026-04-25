import express from 'express';
import session from 'express-session';
import { authRouter } from '../../routes/auth';
import { vocRouter } from '../../routes/vocs';
import { commentRouter } from '../../routes/comments';
import { noteRouter } from '../../routes/notes';
import { attachmentRouter } from '../../routes/attachments';
import { tagsRouter, tagRulesRouter, vocTagsRouter } from '../../routes/tags';
import { dashboardRouter } from '../../routes/dashboard';
import { noticesRouter } from '../../routes/notices';
import { faqCategoriesRouter, faqsRouter } from '../../routes/faqs';
import { adminRouter, systemsPublicRouter, vocTypesPublicRouter } from '../../routes/admin';
import { notificationRouter } from '../../routes/notifications';
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
  app.use('/api/tags', authMiddleware, tagsRouter);
  app.use('/api/tag-rules', authMiddleware, tagRulesRouter);
  app.use('/api/vocs', authMiddleware, vocRouter);
  app.use('/api/vocs/:id/tags', authMiddleware, vocTagsRouter);
  app.use('/api/vocs/:vocId/comments', authMiddleware, commentRouter);
  app.use('/api/vocs/:vocId/notes', authMiddleware, noteRouter);
  app.use('/api/vocs/:vocId/attachments', authMiddleware, attachmentRouter);
  app.use('/api/dashboard', authMiddleware, dashboardRouter);
  app.use('/api/notices', authMiddleware, noticesRouter);
  app.use('/api/faq-categories', authMiddleware, faqCategoriesRouter);
  app.use('/api/faqs', authMiddleware, faqsRouter);
  app.use('/api/admin', authMiddleware, adminRouter);
  app.use('/api/systems', authMiddleware, systemsPublicRouter);
  app.use('/api/voc-types', authMiddleware, vocTypesPublicRouter);
  app.use('/api/notifications', authMiddleware, notificationRouter);

  return app;
}
