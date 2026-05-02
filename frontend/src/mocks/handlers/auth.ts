import { http, HttpResponse } from 'msw';
import type { AuthUser, AuthRole } from '../../api/auth';

let currentUser: AuthUser | null = null;

const fixturesByRole: Record<AuthRole, AuthUser> = {
  admin: { id: 'mock-admin', name: 'Mock Admin', role: 'admin', email: 'admin@mock.local' },
  manager: {
    id: 'mock-manager',
    name: 'Mock Manager',
    role: 'manager',
    email: 'manager@mock.local',
  },
  dev: { id: 'mock-dev', name: 'Mock Dev', role: 'dev', email: 'dev@mock.local' },
  user: { id: 'mock-user', name: 'Mock User', role: 'user', email: 'user@mock.local' },
};

export const authHandlers = [
  http.post('/api/auth/mock-login', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { role?: AuthRole };
    const role = body.role && fixturesByRole[body.role] ? body.role : 'admin';
    currentUser = fixturesByRole[role];
    return HttpResponse.json({ user: currentUser });
  }),

  http.get('/api/auth/me', () => {
    if (!currentUser) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json(currentUser);
  }),

  http.post('/api/auth/logout', () => {
    currentUser = null;
    return new HttpResponse(null, { status: 204 });
  }),
];
