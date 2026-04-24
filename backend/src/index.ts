import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
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

if (process.env.NODE_ENV !== 'production') {
  const specPath = path.resolve(__dirname, '../../shared/openapi.yaml');
  const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as object;
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

const isMain = process.argv[1] && __filename.endsWith(process.argv[1].replace(/\.js$/, ''));
if (isMain || require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

export { app };
