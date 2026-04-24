import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const REQUIRED_ENV = ['DATABASE_URL', 'SESSION_SECRET'] as const;
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[backend] Missing required env vars: ${missing.join(', ')}. Exiting.`);
  process.exit(1);
}

const rawPort = process.env.PORT ?? '3000';
const PORT = parseInt(rawPort, 10);
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`[backend] Invalid PORT value: "${rawPort}". Must be 1–65535. Exiting.`);
  process.exit(1);
}

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[backend] Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[backend] Uncaught exception:', err);
  process.exit(1);
});

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  const missingNow = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missingNow.length > 0) {
    res.status(503).json({ status: 'error', missing: missingNow });
    return;
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`[backend] Listening on port ${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[backend] Port ${PORT} is already in use. Exiting.`);
  } else if (err.code === 'EACCES') {
    console.error(`[backend] Insufficient permissions to bind port ${PORT}. Exiting.`);
  } else {
    console.error('[backend] Server failed to start:', err);
  }
  process.exit(1);
});

export default app;
