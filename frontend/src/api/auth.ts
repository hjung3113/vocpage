export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
}

export type AuthRole = AuthUser['role'];

export async function mockLogin(role: AuthRole): Promise<AuthUser> {
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

export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json() as Promise<AuthUser>;
}
