import { Router } from 'express';
import { mockAuthMiddleware } from '../auth/mockAuth';
import { MOCK_USERS } from '../auth/mockUsers';

export const authRouter = Router();

authRouter.post('/mock-login', (req, res): void => {
  if (process.env.AUTH_MODE !== 'mock') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { role } = req.body as { role?: string };
  if (role !== 'admin' && role !== 'manager' && role !== 'user') {
    res.status(400).json({ error: 'Invalid role. Expected admin, manager, or user.' });
    return;
  }

  const user = MOCK_USERS.find((u) => u.role === role)!;
  req.session.user = user;
  res.json({ user });
});

authRouter.post('/logout', (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

authRouter.get('/me', mockAuthMiddleware, (req, res): void => {
  res.json(req.user);
});
