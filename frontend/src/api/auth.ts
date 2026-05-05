// AuthUser/AuthRole/getMe moved to entities/user/api/userApi (Step 3)
// mockLogin/logout will move to features/auth/api/authApi (Step 4)
export type { AuthUser, AuthRole } from '@entities/user/api/userApi';
export { getMe } from '@entities/user/api/userApi';

import type { AuthUser } from '@entities/user/api/userApi';

export async function mockLogin(role: AuthUser['role']): Promise<AuthUser> {
  const res = await fetch('/api/auth/mock-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`mock-login failed: ${res.status}`);
  const data = (await res.json()) as { user: AuthUser };
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
