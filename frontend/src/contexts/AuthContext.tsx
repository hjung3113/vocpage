import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { mockLogin as apiMockLogin, logout as apiLogout, getMe } from '../api/auth';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (role: AuthUser['role']) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me ? { id: me.id, email: me.email, name: me.name, role: me.role } : null);
    } catch {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (role: AuthUser['role']) => {
    if (import.meta.env.VITE_AUTH_MODE !== 'mock') {
      throw new Error('login() is only available in mock auth mode');
    }
    const me = await apiMockLogin(role);
    setUser({ id: me.id, email: me.email, name: me.name, role: me.role });
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refresh }),
    [user, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
