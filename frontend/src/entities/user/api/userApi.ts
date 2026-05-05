export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: 'admin' | 'manager' | 'dev' | 'user';
  department?: string;
}

export type AuthRole = AuthUser['role'];

export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json() as Promise<AuthUser>;
}
