import { env } from '@shared/config/env';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { mockLogin as apiMockLogin, logout as apiLogout } from '../api/authApi';
import { getMe } from '@entities/user/api/userApi';
import type { AuthUser } from '@entities/user/api/userApi';

export type { AuthUser };

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
    if (env.AUTH_MODE !== 'mock') {
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
