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

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Backend running on port ${PORT}`);
  });
}

export { app };
