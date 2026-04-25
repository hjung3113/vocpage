import cors from 'cors';
import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { createAuthMiddleware } from './auth';
import { authRouter } from './routes/auth';
import { vocRouter } from './routes/vocs';
import { commentRouter } from './routes/comments';
import { noteRouter } from './routes/notes';
import { attachmentRouter } from './routes/attachments';
import { tagsRouter, tagRulesRouter, vocTagsRouter } from './routes/tags';
import { dashboardRouter } from './routes/dashboard';
import { noticesRouter } from './routes/notices';
import { faqCategoriesRouter, faqsRouter } from './routes/faqs';
import { adminRouter, systemsPublicRouter, vocTypesPublicRouter } from './routes/admin';
import { notificationRouter } from './routes/notifications';
import { mastersRouter, adminMastersRouter } from './routes/masters';
import { masterCache } from './services/masterCache';
import logger from './logger';

// Fail fast if AUTH_MODE is misconfigured — throws before server starts
createAuthMiddleware();

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(pinoHttp({ logger }));
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

if (!isProduction) {
  const specPath = path.resolve(__dirname, '../../shared/openapi.yaml');
  const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as object;
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

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
app.use('/api/admin/masters', authMiddleware, adminMastersRouter);
app.use('/api/systems', authMiddleware, systemsPublicRouter);
app.use('/api/voc-types', authMiddleware, vocTypesPublicRouter);
app.use('/api/notifications', authMiddleware, notificationRouter);
app.use('/api/masters', authMiddleware, mastersRouter);

if (require.main === module) {
  masterCache.init().catch((err) => logger.warn({ err }, 'masterCache.init failed (non-fatal)'));
  app.listen(PORT, () => {
    logger.info(`Backend running on port ${PORT}`);
  });
}

export { app };
