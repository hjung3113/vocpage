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
