import express from 'express';
import session from 'express-session';
import { createAuthMiddleware } from './auth';
import { authRouter } from './routes/auth';

// Fail fast if AUTH_MODE is misconfigured — throws before server starts
createAuthMiddleware();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

export { app };
