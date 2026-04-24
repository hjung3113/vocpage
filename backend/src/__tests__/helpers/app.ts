import express from 'express';
import session from 'express-session';
import { authRouter } from '../../routes/auth';
import { setPool } from '../../db';
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

  return app;
}
